import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import { storiesAdapter } from './storiesSlice';

const adapterSelectors = storiesAdapter.getSelectors(
  (state: RootState) => state.stories,
);

export const selectAllStories = adapterSelectors.selectAll;
export const selectStoryById = adapterSelectors.selectById;
export const selectStoriesStatus = (state: RootState) => state.stories.status;
export const selectStoriesError = (state: RootState) => state.stories.error;
export const selectFilter = (state: RootState) => state.stories.filter;

export const selectVisibleStories = createSelector(
  [selectAllStories, selectFilter],
  (stories, { query, category }) => {
    const needle = query.trim().toLowerCase();
    return stories.filter(story => {
      if (category !== 'all' && story.category !== category) {
        return false;
      }
      if (needle === '') {
        return true;
      }
      return (
        story.title.toLowerCase().includes(needle) ||
        story.author.toLowerCase().includes(needle) ||
        story.summary.toLowerCase().includes(needle)
      );
    });
  },
);

export const selectHasActiveFilter = createSelector(
  [selectFilter],
  ({ query, category }) => query.trim() !== '' || category !== 'all',
);
