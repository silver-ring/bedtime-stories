import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing } from '../../../shared/theme/tokens';
import type { Story } from '../../../types/domain';

interface ContinueReadingCardProps {
  story: Story;
  fraction: number;
  onPress: (id: string) => void;
}

export function ContinueReadingCard({
  story,
  fraction,
  onPress,
}: ContinueReadingCardProps) {
  const { palette } = useTheme();
  const percent = Math.round(fraction * 100);
  return (
    <Pressable
      onPress={() => onPress(story.id)}
      accessibilityRole="button"
      accessibilityLabel={`Continue reading ${story.title}, ${percent} percent read`}
      style={[styles.card, { backgroundColor: palette.accent }]}
    >
      <Text style={[styles.kicker, { color: palette.onAccent }]}>
        Continue reading
      </Text>
      <Text
        style={[styles.title, { color: palette.onAccent }]}
        numberOfLines={1}
      >
        {story.title}
      </Text>
      <Text style={[styles.meta, { color: palette.onAccent }]}>
        {percent}% read
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    opacity: 0.85,
  },
  title: { fontSize: 20, fontWeight: '700' },
  meta: { fontSize: 14, opacity: 0.9 },
});
