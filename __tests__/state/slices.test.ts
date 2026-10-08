import { toggleFavorite } from '../../src/features/favorites/favoritesSlice';
import { selectFavoriteStories } from '../../src/features/favorites/selectors';
import {
  allProgressCleared,
  progressReset,
  progressUpdated,
} from '../../src/features/progress/progressSlice';
import { selectContinueReading } from '../../src/features/progress/selectors';
import {
  fontScaleDecreased,
  fontScaleIncreased,
  themeSet,
} from '../../src/features/settings/readerSettingsSlice';
import { fetchStories } from '../../src/features/stories/storiesSlice';
import { makeTestStore } from '../../src/test-utils/renderWithStore';
import type { ThemeName } from '../../src/types/domain';

describe('favorites', () => {
  it('U5: toggling twice adds then removes, and keeps the order of the others', () => {
    const { store } = makeTestStore();
    store.dispatch(toggleFavorite('a'));
    store.dispatch(toggleFavorite('b'));
    store.dispatch(toggleFavorite('c'));
    expect(store.getState().favorites.ids).toEqual(['a', 'b', 'c']);
    store.dispatch(toggleFavorite('b'));
    expect(store.getState().favorites.ids).toEqual(['a', 'c']);
  });

  it('U5: selectFavoriteStories skips ids of stories that no longer exist', async () => {
    const { store } = makeTestStore();
    await store.dispatch(fetchStories());
    store.dispatch(toggleFavorite('snow'));
    store.dispatch(toggleFavorite('removed-story'));
    expect(selectFavoriteStories(store.getState()).map(s => s.id)).toEqual([
      'snow',
    ]);
  });
});

describe('progress', () => {
  it('U6: clamps the fraction and marks completion at 0.98', () => {
    const { store } = makeTestStore();
    store.dispatch(progressUpdated({ id: 'a', fraction: -3 }));
    expect(store.getState().progress.byStoryId.a?.fraction).toBe(0);
    store.dispatch(progressUpdated({ id: 'a', fraction: 7 }));
    expect(store.getState().progress.byStoryId.a).toMatchObject({
      fraction: 1,
      completed: true,
    });
    store.dispatch(progressUpdated({ id: 'a', fraction: 0.97 }));
    expect(store.getState().progress.byStoryId.a?.completed).toBe(false);
    store.dispatch(progressUpdated({ id: 'a', fraction: Number.NaN }));
    expect(store.getState().progress.byStoryId.a?.fraction).toBe(0);
  });

  it('U6: reset removes one entry and clear removes all', () => {
    const { store } = makeTestStore();
    store.dispatch(progressUpdated({ id: 'a', fraction: 0.5 }));
    store.dispatch(progressUpdated({ id: 'b', fraction: 0.5 }));
    store.dispatch(progressReset('a'));
    expect(Object.keys(store.getState().progress.byStoryId)).toEqual(['b']);
    store.dispatch(allProgressCleared());
    expect(store.getState().progress.byStoryId).toEqual({});
  });

  it('U8: continue-reading picks the most recent unfinished existing story', async () => {
    const { store } = makeTestStore();
    await store.dispatch(fetchStories());
    const now = jest.spyOn(Date, 'now');
    now.mockReturnValueOnce(1000);
    store.dispatch(progressUpdated({ id: 'hare', fraction: 0.4 }));
    now.mockReturnValueOnce(3000);
    store.dispatch(progressUpdated({ id: 'snow', fraction: 0.3 }));
    now.mockReturnValueOnce(5000);
    store.dispatch(progressUpdated({ id: 'hansel', fraction: 1 }));
    now.mockReturnValueOnce(9000);
    store.dispatch(progressUpdated({ id: 'gone', fraction: 0.5 }));
    now.mockRestore();

    expect(selectContinueReading(store.getState())?.story.id).toBe('snow');

    store.dispatch(progressReset('snow'));
    expect(selectContinueReading(store.getState())?.story.id).toBe('hare');
    store.dispatch(allProgressCleared());
    expect(selectContinueReading(store.getState())).toBeUndefined();
  });
});

describe('reader settings', () => {
  it('U7: font scale stops at the smallest and largest step', () => {
    const { store } = makeTestStore();
    for (let i = 0; i < 20; i++) {
      store.dispatch(fontScaleIncreased());
    }
    expect(store.getState().readerSettings.fontScale).toBe(1.75);
    for (let i = 0; i < 20; i++) {
      store.dispatch(fontScaleDecreased());
    }
    expect(store.getState().readerSettings.fontScale).toBe(0.85);
  });

  it('U7: accepts only known theme names', () => {
    const { store } = makeTestStore();
    store.dispatch(themeSet('sepia'));
    expect(store.getState().readerSettings.theme).toBe('sepia');
    store.dispatch(themeSet('neon' as ThemeName));
    expect(store.getState().readerSettings.theme).toBe('sepia');
  });
});
