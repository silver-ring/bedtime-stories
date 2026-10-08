import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { Story } from '../../types/domain';
import type { ProgressEntry } from './progressSlice';

export const selectProgressMap = (state: RootState) => state.progress.byStoryId;

export const selectProgressFor = (
  state: RootState,
  id: string,
): ProgressEntry | undefined => state.progress.byStoryId[id];

/** Below this a story counts as not started. */
const STARTED_THRESHOLD = 0.01;

/** The most recently read story that is started but not finished. */
export const selectContinueReading = createSelector(
  [selectProgressMap, (state: RootState) => state.stories.entities],
  (
    progress,
    entities,
  ): { story: Story; progress: ProgressEntry } | undefined => {
    let best: { story: Story; progress: ProgressEntry } | undefined;
    for (const [id, entry] of Object.entries(progress)) {
      const story = entities[id];
      if (!story || entry.completed || entry.fraction < STARTED_THRESHOLD) {
        continue;
      }
      if (!best || entry.updatedAt > best.progress.updatedAt) {
        best = { story, progress: entry };
      }
    }
    return best;
  },
);
