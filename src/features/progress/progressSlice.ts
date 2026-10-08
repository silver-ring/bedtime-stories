import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const COMPLETED_THRESHOLD = 0.98;

export interface ProgressEntry {
  /** Scroll position as a share of the scrollable length, 0 to 1. */
  fraction: number;
  updatedAt: number;
  completed: boolean;
}

export interface ProgressState {
  byStoryId: Record<string, ProgressEntry>;
}

export const initialProgress: ProgressState = { byStoryId: {} };

export function clampFraction(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

interface ProgressUpdate {
  id: string;
  fraction: number;
  updatedAt: number;
}

const progressSlice = createSlice({
  name: 'progress',
  initialState: initialProgress,
  reducers: {
    progressUpdated: {
      reducer(state, action: PayloadAction<ProgressUpdate>) {
        const { id, fraction, updatedAt } = action.payload;
        const clamped = clampFraction(fraction);
        state.byStoryId[id] = {
          fraction: clamped,
          updatedAt,
          completed: clamped >= COMPLETED_THRESHOLD,
        };
      },
      // The timestamp is added here so the reducer itself stays pure.
      prepare(payload: { id: string; fraction: number }) {
        return { payload: { ...payload, updatedAt: Date.now() } };
      },
    },
    progressReset(state, action: PayloadAction<string>) {
      delete state.byStoryId[action.payload];
    },
    allProgressCleared(state) {
      state.byStoryId = {};
    },
  },
});

export const { progressUpdated, progressReset, allProgressCleared } =
  progressSlice.actions;
export const progressReducer = progressSlice.reducer;
