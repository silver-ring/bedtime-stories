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

function progressLabel(progress: ProgressEntry | undefined): string | null {
  if (!progress) {
    return null;
  }
  if (progress.completed) {
    return 'Finished';
  }
  const percent = Math.round(progress.fraction * 100);
  return percent > 0 ? `${percent}% read` : null;
}

export function StoryCard({
  story,
  progress,
  isFavorite,
  onPress,
  onToggleFavorite,
}: StoryCardProps) {
  const { palette } = useTheme();
  const status = progressLabel(progress);
  return (
    <Pressable
      onPress={() => onPress(story.id)}
      accessibilityRole="button"
      accessibilityLabel={`${story.title} by ${story.author}, ${story.readingMinutes} minute read`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: palette.surface,
          borderColor: palette.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.body}>
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
            <Text style={[styles.chipText, { color: palette.chipText }]}>
              {story.readingMinutes} min read
            </Text>
          </View>
          {status ? (
            <View style={[styles.chip, { backgroundColor: palette.chip }]}>
              <Text style={[styles.chipText, { color: palette.chipText }]}>
                {status}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  body: { flex: 1, gap: spacing.xs },
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
  heart: { marginLeft: spacing.md, minWidth: 44, alignItems: 'center' },
  heartGlyph: { fontSize: 28 },
});
