import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ThemeName } from '../../types/domain';

export const FONT_SCALE_STEPS = [0.85, 1, 1.15, 1.3, 1.5, 1.75] as const;
export const DEFAULT_FONT_SCALE = 1;
export const MIN_FONT_SCALE = 0.85;
export const MAX_FONT_SCALE = 1.75;
export const THEME_NAMES: readonly ThemeName[] = [
  'system',
  'light',
  'sepia',
  'dark',
];

export interface ReaderSettingsState {
  fontScale: number;
  theme: ThemeName;
}

export const initialReaderSettings: ReaderSettingsState = {
  fontScale: DEFAULT_FONT_SCALE,
  theme: 'system',
};

/** Snaps any number to the nearest allowed step. */
export function snapFontScale(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_FONT_SCALE;
  }
  let best: number = DEFAULT_FONT_SCALE;
  let bestDistance = Infinity;
  for (const step of FONT_SCALE_STEPS) {
    const distance = Math.abs(step - value);
    if (distance < bestDistance) {
      best = step;
      bestDistance = distance;
    }
  }
  return best;
}

export function isThemeName(value: unknown): value is ThemeName {
  return THEME_NAMES.some(name => name === value);
}

const readerSettingsSlice = createSlice({
  name: 'readerSettings',
  initialState: initialReaderSettings,
  reducers: {
    fontScaleIncreased(state) {
      const next = FONT_SCALE_STEPS.find(step => step > state.fontScale);
      if (next !== undefined) {
        state.fontScale = next;
      }
    },
    fontScaleDecreased(state) {
      const smaller = FONT_SCALE_STEPS.filter(step => step < state.fontScale);
      const previous = smaller[smaller.length - 1];
      if (previous !== undefined) {
        state.fontScale = previous;
      }
    },
    themeSet(state, action: PayloadAction<ThemeName>) {
      if (isThemeName(action.payload)) {
        state.theme = action.payload;
      }
    },
  },
});

export const { fontScaleIncreased, fontScaleDecreased, themeSet } =
  readerSettingsSlice.actions;
export const readerSettingsReducer = readerSettingsSlice.reducer;
