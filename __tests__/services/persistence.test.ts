import { toggleFavorite } from '../../src/features/favorites/favoritesSlice';
import { progressUpdated } from '../../src/features/progress/progressSlice';
import { themeSet } from '../../src/features/settings/readerSettingsSlice';
import { fetchStories } from '../../src/features/stories/storiesSlice';
import {
  loadPersistedState,
  parsePersistedState,
  SAVE_DEBOUNCE_MS,
  STORAGE_KEY,
  STORAGE_VERSION,
} from '../../src/services/persistence';
import { createMemoryStorage } from '../../src/services/storage';
import { makeTestStore } from '../../src/test-utils/renderWithStore';

describe('parsePersistedState', () => {
  it('U9: returns undefined for null, wrong shapes and other versions', () => {
    expect(parsePersistedState(null)).toBeUndefined();
    expect(parsePersistedState('text')).toBeUndefined();
    expect(parsePersistedState([])).toBeUndefined();
    expect(parsePersistedState({ version: 99 })).toBeUndefined();
  });

  it('U9: falls back to defaults for wrong types inside a valid envelope', () => {
    const parsed = parsePersistedState({
      version: STORAGE_VERSION,
      favorites: { ids: 'nope' },
      progress: { byStoryId: 5 },
      readerSettings: { fontScale: 'big', theme: 42 },
    });
    expect(parsed).toEqual({
      favorites: { ids: [] },
      progress: { byStoryId: {} },
      readerSettings: { fontScale: 1, theme: 'system' },
    });
  });

  it('U9: clamps out-of-range numbers and drops malformed entries', () => {
    const parsed = parsePersistedState({
      version: STORAGE_VERSION,
      favorites: { ids: ['a', 3, 'a', 'b'] },
      progress: {
        byStoryId: {
          good: { fraction: 7, updatedAt: 5 },
          bad: { fraction: 'x' },
          alsoBad: null,
        },
      },
      readerSettings: { fontScale: -2, theme: 'dark' },
    });
    expect(parsed?.favorites.ids).toEqual(['a', 'b']);
    expect(parsed?.progress.byStoryId).toEqual({
      good: { fraction: 1, updatedAt: 5, completed: true },
    });
    expect(parsed?.readerSettings).toEqual({ fontScale: 0.85, theme: 'dark' });
  });
});

describe('loadPersistedState', () => {
  it('U9: never throws on corrupt JSON', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{not json' });
    await expect(loadPersistedState(storage)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('U9: returns undefined when nothing is stored', async () => {
    await expect(
      loadPersistedState(createMemoryStorage()),
    ).resolves.toBeUndefined();
  });
});

describe('persistence listener', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('U10: collapses rapid actions into one write with the latest state', async () => {
    const storage = createMemoryStorage();
    const setItem = jest.spyOn(storage, 'setItem');
    const { store } = makeTestStore({ storage });

    store.dispatch(progressUpdated({ id: 'a', fraction: 0.1 }));
    store.dispatch(progressUpdated({ id: 'a', fraction: 0.2 }));
    store.dispatch(progressUpdated({ id: 'a', fraction: 0.6 }));
    expect(setItem).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 10);
    expect(setItem).toHaveBeenCalledTimes(1);

    const saved = JSON.parse(storage.dump()[STORAGE_KEY] ?? '{}');
    expect(saved.version).toBe(STORAGE_VERSION);
    expect(saved.progress.byStoryId.a.fraction).toBe(0.6);
    expect(Object.keys(saved).sort()).toEqual([
      'favorites',
      'progress',
      'readerSettings',
      'version',
    ]);
  });

  it('U10: ignores actions from non-persisted slices', async () => {
    const storage = createMemoryStorage();
    const setItem = jest.spyOn(storage, 'setItem');
    const { store } = makeTestStore({ storage });
    await store.dispatch(fetchStories());
    await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 10);
    expect(setItem).not.toHaveBeenCalled();
  });

  it('U11: a failing write is swallowed and the store keeps working', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const storage = createMemoryStorage();
    jest.spyOn(storage, 'setItem').mockRejectedValue(new Error('disk full'));
    const { store } = makeTestStore({ storage });

    store.dispatch(toggleFavorite('a'));
    await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 10);

    expect(warn).toHaveBeenCalled();
    store.dispatch(toggleFavorite('b'));
    expect(store.getState().favorites.ids).toEqual(['a', 'b']);
    warn.mockRestore();
  });

  it('U12: a new store built from saved state matches the old one', async () => {
    const storage = createMemoryStorage();
    const first = makeTestStore({ storage }).store;
    first.dispatch(toggleFavorite('snow'));
    first.dispatch(progressUpdated({ id: 'snow', fraction: 0.42 }));
    first.dispatch(themeSet('sepia'));
    await jest.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 10);

    const loaded = await loadPersistedState(storage);
    const second = makeTestStore({ preloaded: loaded }).store.getState();

    expect(second.favorites).toEqual(first.getState().favorites);
    expect(second.progress).toEqual(first.getState().progress);
    expect(second.readerSettings).toEqual(first.getState().readerSettings);
    expect(second.stories.status).toBe('idle');
  });
});
