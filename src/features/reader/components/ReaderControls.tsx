import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing } from '../../../shared/theme/tokens';
import type { ThemeName } from '../../../types/domain';
import {
  fontScaleDecreased,
  fontScaleIncreased,
  MAX_FONT_SCALE,
  MIN_FONT_SCALE,
  themeSet,
} from '../../settings/readerSettingsSlice';

const THEME_OPTIONS: ReadonlyArray<{ value: ThemeName; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'dark', label: 'Dark' },
];

export function ReaderControls() {
  const dispatch = useAppDispatch();
  const { palette } = useTheme();
  const fontScale = useAppSelector(state => state.readerSettings.fontScale);
  const theme = useAppSelector(state => state.readerSettings.theme);

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <View style={styles.row}>
        <ControlButton
          label="A−"
          accessibilityLabel="Decrease text size"
          disabled={fontScale <= MIN_FONT_SCALE}
          onPress={() => dispatch(fontScaleDecreased())}
        />
        <Text style={[styles.value, { color: palette.textMuted }]}>
          {Math.round(fontScale * 100)}%
        </Text>
        <ControlButton
          label="A+"
          accessibilityLabel="Increase text size"
          disabled={fontScale >= MAX_FONT_SCALE}
          onPress={() => dispatch(fontScaleIncreased())}
        />
      </View>
      <View style={styles.row}>
        {THEME_OPTIONS.map(option => (
          <ControlButton
            key={option.value}
            label={option.label}
            accessibilityLabel={`${option.label} theme`}
            selected={theme === option.value}
            onPress={() => dispatch(themeSet(option.value))}
          />
        ))}
      </View>
    </View>
  );
}

function ControlButton({
  label,
  accessibilityLabel,
  onPress,
  selected = false,
  disabled = false,
}: {
  label: string;
  accessibilityLabel: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      style={[
        styles.button,
        { backgroundColor: selected ? palette.accent : palette.chip },
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonLabel,
          { color: selected ? palette.onAccent : palette.chipText },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    margin: spacing.lg,
    marginBottom: 0,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  value: { minWidth: 56, textAlign: 'center', fontSize: 15 },
  button: {
    minHeight: 44,
    minWidth: 64,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontSize: 16, fontWeight: '700' },
  disabled: { opacity: 0.4 },
});
