import { createListenerMiddleware } from '@reduxjs/toolkit';
import {
  initialFavorites,
  type FavoritesState,
} from '../features/favorites/favoritesSlice';
import {
  clampFraction,
  COMPLETED_THRESHOLD,
  initialProgress,
  type ProgressEntry,
  type ProgressState,
} from '../features/progress/progressSlice';
import {
  initialReaderSettings,
  isThemeName,
  snapFontScale,
  type ReaderSettingsState,
} from '../features/settings/readerSettingsSlice';
import type { KeyValueStorage } from './storage';

export const STORAGE_KEY = 'bedtime-stories:v1';
export const STORAGE_VERSION = 1;
export const SAVE_DEBOUNCE_MS = 500;

/** The slices that survive an app restart. */
export interface PersistedSlices {
  favorites: FavoritesState;
  progress: ProgressState;
  readerSettings: ReaderSettingsState;
}

interface PersistedEnvelope extends PersistedSlices {
  version: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function parseFavorites(raw: unknown): FavoritesState {
  if (!isRecord(raw) || !Array.isArray(raw.ids)) {
    return initialFavorites;
  }
  const ids = raw.ids.filter((id): id is string => typeof id === 'string');
  return { ids: [...new Set(ids)] };
}

function parseProgress(raw: unknown): ProgressState {
  if (!isRecord(raw) || !isRecord(raw.byStoryId)) {
    return initialProgress;
  }
  const byStoryId: Record<string, ProgressEntry> = {};
  for (const [id, entry] of Object.entries(raw.byStoryId)) {
    if (!isRecord(entry) || typeof entry.fraction !== 'number') {
      continue;
    }
    const fraction = clampFraction(entry.fraction);
    byStoryId[id] = {
      fraction,
      updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : 0,
      completed: fraction >= COMPLETED_THRESHOLD,
    };
  }
  return { byStoryId };
}

function parseReaderSettings(raw: unknown): ReaderSettingsState {
  if (!isRecord(raw)) {
    return initialReaderSettings;
  }
  return {
    fontScale:
      typeof raw.fontScale === 'number'
        ? snapFontScale(raw.fontScale)
        : initialReaderSettings.fontScale,
    theme: isThemeName(raw.theme) ? raw.theme : initialReaderSettings.theme,
  };
}

/**
 * Validates untrusted stored data. Never throws: anything unusable falls back
 * to defaults, and a different schema version is ignored entirely.
 */
export function parsePersistedState(raw: unknown): PersistedSlices | undefined {
  if (!isRecord(raw) || raw.version !== STORAGE_VERSION) {
    return undefined;
  }
  return {
    favorites: parseFavorites(raw.favorites),
    progress: parseProgress(raw.progress),
    readerSettings: parseReaderSettings(raw.readerSettings),
  };
}

export async function loadPersistedState(
  storage: KeyValueStorage,
): Promise<PersistedSlices | undefined> {
  try {
    const stored = await storage.getItem(STORAGE_KEY);
    if (stored === null) {
      return undefined;
    }
    const parsed = parsePersistedState(JSON.parse(stored));
    if (__DEV__) {
      console.log(
        parsed
          ? `[persist] loaded v${STORAGE_VERSION} (${stored.length} bytes)`
          : '[persist] stored state ignored, using defaults',
      );
    }
    return parsed;
  } catch (error) {
    console.warn('[persist] could not read stored state', error);
    return undefined;
  }
}

export async function savePersistedState(
  storage: KeyValueStorage,
  state: PersistedSlices,
): Promise<void> {
  const envelope: PersistedEnvelope = {
    version: STORAGE_VERSION,
    favorites: state.favorites,
    progress: state.progress,
    readerSettings: state.readerSettings,
  };
  try {
    const json = JSON.stringify(envelope);
    await storage.setItem(STORAGE_KEY, json);
    if (__DEV__) {
      console.log(`[persist] saved ${json.length} bytes`);
    }
  } catch (error) {
    // Persistence must never take the app down: keep running in memory.
    console.warn('[persist] could not save state', error);
  }
}

const PERSISTED_PREFIXES = ['favorites/', 'progress/', 'readerSettings/'];

/**
 * Saves the persisted slices after changes settle. Rapid actions (for example
 * scroll progress) are collapsed into a single write.
 */
export function createPersistenceListener(
  storage: KeyValueStorage,
  debounceMs: number = SAVE_DEBOUNCE_MS,
) {
  const listener = createListenerMiddleware<PersistedSlices>();
  listener.startListening({
    predicate: action =>
      PERSISTED_PREFIXES.some(prefix => action.type.startsWith(prefix)),
    effect: async (_action, api) => {
      api.cancelActiveListeners();
      await api.delay(debounceMs);
      await savePersistedState(storage, api.getState());
    },
  });
  return listener;
}
