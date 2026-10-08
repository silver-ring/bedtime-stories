import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Keyboard,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { EmptyView } from '../../../shared/components/EmptyView';
import { ErrorView } from '../../../shared/components/ErrorView';
import { LoadingView } from '../../../shared/components/LoadingView';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';
import { selectContinueReading } from '../../progress/selectors';
import { CategoryChips } from '../components/CategoryChips';
import { ContinueReadingCard } from '../components/ContinueReadingCard';
import { SearchBar } from '../components/SearchBar';
import { StoryRow } from '../components/StoryRow';
import {
  selectFilter,
  selectHasActiveFilter,
  selectStoriesError,
  selectStoriesStatus,
  selectVisibleStories,
} from '../selectors';
import {
  categorySet,
  fetchStories,
  filterCleared,
  querySet,
} from '../storiesSlice';

const SEARCH_DEBOUNCE_MS = 250;

export function LibraryScreen({
  onOpenStory,
}: {
  onOpenStory: (id: string) => void;
}) {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectStoriesStatus);
  const error = useAppSelector(selectStoriesError);
  const filter = useAppSelector(selectFilter);
  const hasFilter = useAppSelector(selectHasActiveFilter);
  const stories = useAppSelector(selectVisibleStories);
  const continueReading = useAppSelector(selectContinueReading);

  // The text box is local state; only the debounced value reaches Redux.
  const [text, setText] = useState(filter.query);

  useEffect(() => {
    dispatch(fetchStories());
  }, [dispatch]);

  useEffect(() => {
    const handle = setTimeout(
      () => dispatch(querySet(text)),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(handle);
  }, [dispatch, text]);

  // Keep the box in sync when the filter is cleared from elsewhere.
  useEffect(() => {
    if (filter.query === '') {
      setText('');
    }
  }, [filter.query]);

  const retry = useCallback(() => {
    dispatch(fetchStories({ force: true }));
  }, [dispatch]);

  const clearFilters = useCallback(() => {
    Keyboard.dismiss();
    setText('');
    dispatch(filterCleared());
  }, [dispatch]);

  if (status === 'idle' || (status === 'loading' && stories.length === 0)) {
    return (
      <ScreenContainer>
        <LoadingView />
      </ScreenContainer>
    );
  }

  if (status === 'failed') {
    return (
      <ScreenContainer>
        <ErrorView
          message={error?.message ?? 'Could not load the stories.'}
          onRetry={retry}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={stories}
        keyExtractor={story => story.id}
        renderItem={({ item }) => (
          <StoryRow story={item} onOpen={onOpenStory} />
        )}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={status === 'loading'} onRefresh={retry} />
        }
        ListHeaderComponent={
          <View>
            <SearchBar value={text} onChangeText={setText} />
            <CategoryChips
              selected={filter.category}
              onSelect={category => dispatch(categorySet(category))}
            />
            {continueReading && !hasFilter ? (
              <ContinueReadingCard
                story={continueReading.story}
                fraction={continueReading.progress.fraction}
                onPress={onOpenStory}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyView
              title="No stories found"
              message="Try a different search or category."
              actionLabel="Clear search"
              onAction={clearFilters}
            />
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 24, flexGrow: 1 },
  empty: { minHeight: 320 },
});
