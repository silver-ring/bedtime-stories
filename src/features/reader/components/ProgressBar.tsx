import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../../shared/theme/ThemeProvider';

export function ProgressBar({ fraction }: { fraction: number }) {
  const { palette } = useTheme();
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel="Reading progress"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      style={[styles.track, { backgroundColor: palette.border }]}
    >
      <View
        style={[
          styles.fill,
          { backgroundColor: palette.accent, width: `${percent}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, width: '100%' },
  fill: { height: 4 },
});
