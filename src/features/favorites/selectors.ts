import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';
import type { Story } from '../../types/domain';

export const selectFavoriteIds = (state: RootState) => state.favorites.ids;

export const selectIsFavorite = (state: RootState, id: string) =>
  state.favorites.ids.includes(id);

/** Favorites in the order they were added; ids of removed stories are skipped. */
export const selectFavoriteStories = createSelector(
  [selectFavoriteIds, (state: RootState) => state.stories.entities],
  (ids, entities) =>
    ids
      .map(id => entities[id])
      .filter((story): story is Story => story !== undefined),
);
