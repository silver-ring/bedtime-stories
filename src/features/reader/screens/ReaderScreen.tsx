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
  // How far into the text the top of the screen is (0 to 1 of the content
  // height). Only real scrolling updates it. A text size change re-lays out the
  // text and the scroll view then emits clamped, transitional scroll events;
  // those must not move it, or a later size change would anchor to garbage.
  const anchorRatio = useRef(0);
  const settling = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousFontScale = useRef(fontScale);

  const endSettlingAfter = useCallback((ms: number) => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
    }
    settleTimer.current = setTimeout(() => {
      settling.current = false;
      settleTimer.current = null;
      const content = contentHeight.current;
      if (content <= 0) {
        return;
      }
      // A size can be reported before the layout is final, so the last scroll
      // may have landed in the wrong place. Check once more now that it is quiet.
      const target = Math.min(
        anchorRatio.current * content,
        Math.max(0, content - viewportHeight.current),
      );
      if (Math.abs(offsetY.current - target) > 1) {
        offsetY.current = target;
        scrollRef.current?.scrollTo({ y: target, animated: false });
      }
    }, ms);
  }, []);

  const currentFraction = useCallback(() => {
    const content = contentHeight.current;
    const viewport = viewportHeight.current;
    // While the layout settles the scroll offset is unreliable: use the anchor.
    const offset = settling.current
      ? Math.min(anchorRatio.current * content, Math.max(0, content - viewport))
      : offsetY.current;
    return scrollFraction(offset, content, viewport);
  }, []);

  // Saves the position, but only once the saved one has been restored, and
  // only if it changed, so opening a story never overwrites progress with 0.
  const commit = useCallback(() => {
    if (!restored.current) {
      return;
    }
    const value = currentFraction();
    // Nothing saved yet and nothing read yet: do not create an empty entry.
    if (lastSaved.current === null && value < 0.001) {
      return;
    }
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
    anchorRatio.current = y / contentHeight.current;
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
      if (restored.current && !settling.current) {
        anchorRatio.current =
          contentSize.height > 0 ? contentOffset.y / contentSize.height : 0;
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
      if (!restored.current) {
        tryRestore();
        return;
      }
      if (!settling.current || height <= 0) {
        return;
      }
      // The text just changed size: keep the same passage at the top. The
      // layout may report a few sizes in a row, so re-apply until it is quiet.
      const y = Math.min(
        anchorRatio.current * height,
        Math.max(0, height - viewportHeight.current),
      );
      offsetY.current = y;
      scrollRef.current?.scrollTo({ y, animated: false });
      setFraction(currentFraction());
      endSettlingAfter(400);
    },
    [currentFraction, endSettlingAfter, tryRestore],
  );

  // A new font scale means the text is about to be re-laid out. Start ignoring
  // scroll events for the position until the layout has settled. The timer
  // covers the case where no size change is reported at all.
  useEffect(() => {
    if (previousFontScale.current === fontScale) {
      return;
    }
    previousFontScale.current = fontScale;
    if (restored.current) {
      settling.current = true;
      endSettlingAfter(1000);
    }
  }, [endSettlingAfter, fontScale]);

  // The reader took over: from here on their scrolling is the truth again.
  const onScrollBeginDrag = useCallback(() => {
    settling.current = false;
    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
      settleTimer.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
      }
    },
    [],
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
        onScrollBeginDrag={onScrollBeginDrag}
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
