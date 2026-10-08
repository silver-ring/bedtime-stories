import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type CategoryFilter,
} from '../../../types/domain';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing } from '../../../shared/theme/tokens';

interface CategoryChipsProps {
  selected: CategoryFilter;
  onSelect: (category: CategoryFilter) => void;
}

const OPTIONS: ReadonlyArray<{ value: CategoryFilter; label: string }> = [
  { value: 'all', label: 'All' },
  ...CATEGORIES.map(value => ({ value, label: CATEGORY_LABELS[value] })),
];

export function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  const { palette } = useTheme();
  return (
    <ScrollView
      horizontal
      keyboardShouldPersistTaps="handled"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {OPTIONS.map(option => {
        const active = option.value === selected;
        return (
          <Pressable
            key={option.value}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityLabel={`Filter: ${option.label}`}
            accessibilityState={{ selected: active }}
            style={[
              styles.chip,
              {
                backgroundColor: active ? palette.accent : palette.chip,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? palette.onAccent : palette.chipText },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    justifyContent: 'center',
  },
  label: { fontSize: 14, fontWeight: '600' },
});
