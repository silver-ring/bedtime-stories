import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  accessibilityLabel,
}: ButtonProps) {
  const { palette } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: primary ? palette.accent : palette.surface,
          borderColor: primary ? palette.accent : palette.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.5}
        style={[
          styles.label,
          { color: primary ? palette.onAccent : palette.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '600' },
});
