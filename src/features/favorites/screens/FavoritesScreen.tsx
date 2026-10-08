import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useAppSelector } from '../../../app/hooks';
import { EmptyView } from '../../../shared/components/EmptyView';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';
import { StoryRow } from '../../stories/components/StoryRow';
import { selectFavoriteStories } from '../selectors';

export function FavoritesScreen({
  onOpenStory,
}: {
  onOpenStory: (id: string) => void;
}) {
  const stories = useAppSelector(selectFavoriteStories);
  return (
    <ScreenContainer>
      <FlatList
        data={stories}
        keyExtractor={story => story.id}
        renderItem={({ item }) => (
          <StoryRow story={item} onOpen={onOpenStory} />
        )}
        ListEmptyComponent={
          <EmptyView
            title="No favorites yet"
            message="Tap the heart on a story to keep it here."
          />
        }
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingTop: 16, paddingBottom: 24, flexGrow: 1 },
});
