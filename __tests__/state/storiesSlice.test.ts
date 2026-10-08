import { selectVisibleStories } from '../../src/features/stories/selectors';
import {
  categorySet,
  fetchStories,
  filterCleared,
  querySet,
} from '../../src/features/stories/storiesSlice';
import { simulateFailureSet } from '../../src/features/settings/devSlice';
import {
  FakeRepository,
  makeTestStore,
} from '../../src/test-utils/renderWithStore';

describe('stories thunk', () => {
  it('U1: moves from idle to loading to succeeded and fills the entities', async () => {
    const { store } = makeTestStore();
    expect(store.getState().stories.status).toBe('idle');

    const pending = store.dispatch(fetchStories());
    expect(store.getState().stories.status).toBe('loading');
    await pending;

    const state = store.getState().stories;
    expect(state.status).toBe('succeeded');
    expect(state.error).toBeNull();
    expect(state.ids).toHaveLength(3);
  });

  it('U2: a failing repository ends in failed with a LOAD_FAILED error and keeps old data', async () => {
    const { store } = makeTestStore();
    await store.dispatch(fetchStories());
    store.dispatch(simulateFailureSet(true));
    await store.dispatch(fetchStories({ force: true }));

    const state = store.getState().stories;
    expect(state.status).toBe('failed');
    expect(state.error?.code).toBe('LOAD_FAILED');
    expect(state.ids).toHaveLength(3);
  });

  it('U2b: a non-AppError rejection is normalized to UNKNOWN', async () => {
    const repository = new FakeRepository();
    repository.getStories = async () => {
      throw new Error('boom');
    };
    const { store } = makeTestStore({ repository });
    await store.dispatch(fetchStories());
    expect(store.getState().stories.error).toEqual({
      code: 'UNKNOWN',
      message: 'boom',
    });
  });

  it('U3: skips a second request while one is loading, and a refetch unless forced', async () => {
    const repository = new FakeRepository(undefined, 20);
    const { store } = makeTestStore({ repository });

    const first = store.dispatch(fetchStories());
    const second = store.dispatch(fetchStories());
    await Promise.all([first, second]);
    expect(repository.calls).toHaveLength(1);

    await store.dispatch(fetchStories());
    expect(repository.calls).toHaveLength(1);

    await store.dispatch(fetchStories({ force: true }));
    expect(repository.calls).toHaveLength(2);
  });
});

describe('visible stories selector', () => {
  async function loadedStore() {
    const { store } = makeTestStore();
    await store.dispatch(fetchStories());
    return store;
  }

  it('U4: filters by query, ignoring case and surrounding whitespace', async () => {
    const store = await loadedStore();
    store.dispatch(querySet('  TORTOISE '));
    expect(selectVisibleStories(store.getState()).map(s => s.id)).toEqual([
      'hare',
    ]);
  });

  it('U4: matches author and summary text too', async () => {
    const store = await loadedStore();
    store.dispatch(querySet('gerda'));
    expect(selectVisibleStories(store.getState()).map(s => s.id)).toEqual([
      'snow',
    ]);
    store.dispatch(querySet('andersen'));
    expect(selectVisibleStories(store.getState()).map(s => s.id)).toEqual([
      'snow',
    ]);
  });

  it('U4: combines category and query, and returns [] when nothing matches', async () => {
    const store = await loadedStore();
    store.dispatch(categorySet('fairy-tale-grimm'));
    expect(selectVisibleStories(store.getState()).map(s => s.id)).toEqual([
      'hansel',
    ]);
    store.dispatch(querySet('tortoise'));
    expect(selectVisibleStories(store.getState())).toEqual([]);
    store.dispatch(filterCleared());
    expect(selectVisibleStories(store.getState())).toHaveLength(3);
  });
});
