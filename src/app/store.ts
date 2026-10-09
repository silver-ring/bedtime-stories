import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { favoritesReducer } from '../features/favorites/favoritesSlice';
import { progressReducer } from '../features/progress/progressSlice';
import { devReducer } from '../features/settings/devSlice';
import { readerSettingsReducer } from '../features/settings/readerSettingsSlice';
import {
  storiesReducer,
  type ThunkExtra,
} from '../features/stories/storiesSlice';
import {
  createPersistenceListener,
  type PersistedSlices,
} from '../services/persistence';
import type { KeyValueStorage } from '../services/storage';
import type { StoryRepository } from '../services/storyRepository';

const rootReducer = combineReducers({
  stories: storiesReducer,
  favorites: favoritesReducer,
  progress: progressReducer,
  readerSettings: readerSettingsReducer,
  dev: devReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export interface StoreDeps {
  repository: StoryRepository;
  storage: KeyValueStorage;
  /** How long changes settle before they are written. Tests shorten it. */
  saveDebounceMs?: number;
}

/**
 * Builds a store. Dependencies are injected so tests can use an in-memory
 * storage and an instant repository. Persisted state is loaded before this is
 * called, so defaults can never overwrite saved data.
 */
export function makeStore(
  { repository, storage, saveDebounceMs }: StoreDeps,
  preloadedState?: Partial<PersistedSlices>,
) {
  const persistence = createPersistenceListener(storage, saveDebounceMs);
  const extra: ThunkExtra = { repository };
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        thunk: { extraArgument: extra },
        // The stories slice holds about 200 KB of text, so the development-only
        // state checks need more than the default 32 ms on a busy device.
        immutableCheck: { warnAfter: 128 },
        serializableCheck: { warnAfter: 128 },
      }).prepend(persistence.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type AppDispatch = AppStore['dispatch'];
