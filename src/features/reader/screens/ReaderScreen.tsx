import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useAppDispatch,
  useAppSelector,
  useAppStore,
} from '../../../app/hooks';
import { EmptyView } from '../../../shared/components/EmptyView';
import { LoadingView } from '../../../shared/components/LoadingView';
import { ScreenContainer } from '../../../shared/components/ScreenContainer';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import {
  READER_BASE_FONT_SIZE,
  READER_LINE_HEIGHT_RATIO,
  spacing,
} from '../../../shared/theme/tokens';
import { toggleFavorite } from '../../favorites/favoritesSlice';
import { selectIsFavorite } from '../../favorites/selectors';
import { progressUpdated } from '../../progress/progressSlice';
import { selectStoriesStatus, selectStoryById } from '../../stories/selectors';
import { ProgressBar } from '../components/ProgressBar';
import { ReaderControls } from '../components/ReaderControls';
import { offsetForFraction, scrollFraction } from '../scrollMath';
import { HEART_FILLED, HEART_OUTLINE } from '../../../shared/theme/glyphs';

interface ReaderScreenProps {
  storyId: string;
  onBack: () => void;
}

export function ReaderScreen({ storyId, onBack }: ReaderScreenProps) {
  const story = useAppSelector(state => selectStoryById(state, storyId));
  const status = useAppSelector(selectStoriesStatus);

  if (!story) {
    return (
      <ScreenContainer>
        {status === 'idle' || status === 'loading' ? (
          <LoadingView />
        ) : (
          <EmptyView
            title="Story not found"
            message="This story is no longer available."
            actionLabel="Back to library"
            onAction={onBack}
          />
        )}
      </ScreenContainer>
    );
  }
  return <StoryReader storyId={story.id} onBack={onBack} />;
}

function StoryReader({ storyId, onBack }: ReaderScreenProps) {
  const dispatch = useAppDispatch();
  const store = useAppStore();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const story = useAppSelector(state => selectStoryById(state, storyId));
  const isFavorite = useAppSelector(state => selectIsFavorite(state, storyId));
  const fontScale = useAppSelector(state => state.readerSettings.fontScale);

  const [controlsOpen, setControlsOpen] = useState(false);
  const [fraction, setFraction] = useState(0);

  const scrollRef = useRef<ScrollView>(null);
  const offsetY = useRef(0);
  const contentHeight = useRef(0);
  const viewportHeight = useRef(0);
  const restored = useRef(false);
  const lastSaved = useRef<number | null>(null);

  const currentFraction = useCallback(
    () =>
      scrollFraction(
        offsetY.current,
        contentHeight.current,
        viewportHeight.current,
      ),
    [],
  );

  // Saves the position, but only once the saved one has been restored, and
  // only if it changed, so opening a story never overwrites progress with 0.
  const commit = useCallback(() => {
    if (!restored.current) {
      return;
    }
    const value = currentFraction();
    if (
      lastSaved.current !== null &&
      Math.abs(value - lastSaved.current) < 0.001
    ) {
      return;
    }
    lastSaved.current = value;
    dispatch(progressUpdated({ id: storyId, fraction: value }));
  }, [currentFraction, dispatch, storyId]);

  const tryRestore = useCallback(() => {
    if (
      restored.current ||
      contentHeight.current === 0 ||
      viewportHeight.current === 0
    ) {
      return;
    }
    restored.current = true;
    const saved = store.getState().progress.byStoryId[storyId];
    // A finished story reopens from the top; otherwise resume where we left off.
    const startFraction = saved && !saved.completed ? saved.fraction : 0;
    lastSaved.current = saved ? saved.fraction : null;
    const y = offsetForFraction(
      startFraction,
      contentHeight.current,
      viewportHeight.current,
    );
    offsetY.current = y;
    setFraction(startFraction);
    if (y > 0) {
      scrollRef.current?.scrollTo({ y, animated: false });
    }
    // Content that fits on one screen has nothing to scroll: count it as read.
    if (contentHeight.current <= viewportHeight.current) {
      commit();
    }
  }, [commit, store, storyId]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } =
        event.nativeEvent;
      offsetY.current = contentOffset.y;
      contentHeight.current = contentSize.height;
      viewportHeight.current = layoutMeasurement.height;
      if (restored.current) {
        setFraction(currentFraction());
      }
    },
    [currentFraction],
  );

  const onViewportLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportHeight.current = event.nativeEvent.layout.height;
      tryRestore();
    },
    [tryRestore],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeight.current = height;
      tryRestore();
    },
    [tryRestore],
  );

  // Save when leaving the screen or when the app goes to the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') {
        commit();
      }
    });
    return () => {
      subscription.remove();
      commit();
    };
  }, [commit]);

  if (!story) {
    return null;
  }

  const fontSize = READER_BASE_FONT_SIZE * fontScale;
  const lineHeight = fontSize * READER_LINE_HEIGHT_RATIO;

  return (
    <ScreenContainer>
      <View style={{ height: insets.top }} />
      <View style={styles.header}>
        <HeaderButton label="‹" accessibilityLabel="Back" onPress={onBack} />
        <Text
          style={[styles.headerTitle, { color: palette.text }]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {story.title}
        </Text>
        <HeaderButton
          label="Aa"
          accessibilityLabel="Reading settings"
          selected={controlsOpen}
          onPress={() => setControlsOpen(open => !open)}
        />
        <HeaderButton
          label={isFavorite ? HEART_FILLED : HEART_OUTLINE}
          accessibilityLabel={
            isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }
          selected={isFavorite}
          onPress={() => dispatch(toggleFavorite(story.id))}
        />
      </View>
      <ProgressBar fraction={fraction} />
      {controlsOpen ? <ReaderControls /> : null}
      <ScrollView
        ref={scrollRef}
        testID="reader-scroll"
        onLayout={onViewportLayout}
        onContentSizeChange={onContentSizeChange}
        onScroll={onScroll}
        scrollEventThrottle={32}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text
          style={[styles.title, { color: palette.text }]}
          accessibilityRole="header"
        >
          {story.title}
        </Text>
        <Text style={[styles.byline, { color: palette.textMuted }]}>
          {story.author} · {story.readingMinutes} min read
        </Text>
        {story.paragraphs.map((paragraph, index) => (
          <Text
            // Paragraphs never reorder, so the index is a stable key here.
            key={index}
            maxFontSizeMultiplier={2}
            style={[
              styles.paragraph,
              { color: palette.text, fontSize, lineHeight },
            ]}
          >
            {paragraph}
          </Text>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

function HeaderButton({
  label,
  accessibilityLabel,
  onPress,
  selected = false,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  selected?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={styles.headerButton}
    >
      <Text
        style={[
          styles.headerButtonLabel,
          { color: selected ? palette.accent : palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    minHeight: 52,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonLabel: { fontSize: 22, fontWeight: '600' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', marginBottom: spacing.sm },
  byline: { fontSize: 14, marginBottom: spacing.xl },
  paragraph: { marginBottom: spacing.lg },
});
