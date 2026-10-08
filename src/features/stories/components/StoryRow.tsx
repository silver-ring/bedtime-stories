import React from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { Story } from '../../../types/domain';
import { selectIsFavorite } from '../../favorites/selectors';
import { toggleFavorite } from '../../favorites/favoritesSlice';
import { selectProgressFor } from '../../progress/selectors';
import { StoryCard } from './StoryCard';

/** Connects a StoryCard to the store so each row updates on its own. */
export const StoryRow = React.memo(function StoryRowView({
  story,
  onOpen,
}: {
  story: Story;
  onOpen: (id: string) => void;
}) {
  const dispatch = useAppDispatch();
  const progress = useAppSelector(state => selectProgressFor(state, story.id));
  const isFavorite = useAppSelector(state => selectIsFavorite(state, story.id));
  return (
    <StoryCard
      story={story}
      progress={progress}
      isFavorite={isFavorite}
      onPress={onOpen}
      onToggleFavorite={id => dispatch(toggleFavorite(id))}
    />
  );
});
