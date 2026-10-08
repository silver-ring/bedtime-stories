import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORY_LABELS, type Story } from '../../../types/domain';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing } from '../../../shared/theme/tokens';
import type { ProgressEntry } from '../../progress/progressSlice';
import { HEART_FILLED, HEART_OUTLINE } from '../../../shared/theme/glyphs';

interface StoryCardProps {
  story: Story;
  progress?: ProgressEntry;
  isFavorite: boolean;
  onPress: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

function progressText(progress: ProgressEntry | undefined): string | null {
  if (!progress) {
    return null;
  }
  if (progress.completed) {
    return 'Finished';
  }
  const percent = Math.round(progress.fraction * 100);
  return percent > 0 ? `${percent}% read` : null;
}

function describe(story: Story, progress: ProgressEntry | undefined): string {
  const base = `${story.title} by ${story.author}, ${story.readingMinutes} minute read`;
  if (!progress) {
    return base;
  }
  if (progress.completed) {
    return `${base}, finished`;
  }
  const percent = Math.round(progress.fraction * 100);
  return percent > 0 ? `${base}, ${percent} percent read` : base;
}

/**
 * The favorite button is a sibling of the card button, not a child. Nesting one
 * accessible button in another hides the inner one from VoiceOver on iOS.
 */
export function StoryCard({
  story,
  progress,
  isFavorite,
  onPress,
  onToggleFavorite,
}: StoryCardProps) {
  const { palette } = useTheme();
  const status = progressText(progress);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <Pressable
        onPress={() => onPress(story.id)}
        accessibilityRole="button"
        accessibilityLabel={describe(story, progress)}
        style={({ pressed }) => [styles.body, pressed && styles.pressed]}
      >
        <Text style={[styles.title, { color: palette.text }]} numberOfLines={2}>
          {story.title}
        </Text>
        <Text style={[styles.meta, { color: palette.textMuted }]}>
          {story.author} · {CATEGORY_LABELS[story.category]}
        </Text>
        <Text
          style={[styles.summary, { color: palette.textMuted }]}
          numberOfLines={2}
        >
          {story.summary}
        </Text>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: palette.chip }]}>
            <Text
              maxFontSizeMultiplier={1.5}
              style={[styles.chipText, { color: palette.chipText }]}
            >
              {story.readingMinutes} min read
            </Text>
          </View>
          {status ? (
            <View style={[styles.chip, { backgroundColor: palette.chip }]}>
              <Text
                maxFontSizeMultiplier={1.5}
                style={[styles.chipText, { color: palette.chipText }]}
              >
                {status}
              </Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={() => onToggleFavorite(story.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          isFavorite
            ? `Remove ${story.title} from favorites`
            : `Add ${story.title} to favorites`
        }
        accessibilityState={{ selected: isFavorite }}
        style={styles.heart}
      >
        <Text
          style={[
            styles.heartGlyph,
            { color: isFavorite ? palette.danger : palette.textMuted },
          ]}
        >
          {isFavorite ? HEART_FILLED : HEART_OUTLINE}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  body: { flex: 1, gap: spacing.xs, padding: spacing.lg },
  pressed: { opacity: 0.85 },
  title: { fontSize: 18, fontWeight: '700' },
  meta: { fontSize: 13 },
  summary: { fontSize: 14, lineHeight: 20, marginTop: spacing.xs },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipText: { fontSize: 12, fontWeight: '600' },
  heart: {
    minWidth: 56,
    paddingTop: spacing.lg,
    paddingRight: spacing.sm,
    alignItems: 'center',
  },
  heartGlyph: { fontSize: 28 },
});
