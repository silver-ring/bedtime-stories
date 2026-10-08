import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';

export function LoadingView({ label = 'Loading stories' }: { label?: string }) {
  const { palette } = useTheme();
  return (
    <View
      style={styles.container}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator size="large" color={palette.accent} />
      <Text style={[styles.label, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  label: { fontSize: 15 },
});
