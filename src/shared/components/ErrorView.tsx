import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';

interface ErrorViewProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorView({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorViewProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.container} accessibilityRole="alert">
      <Text style={[styles.title, { color: palette.danger }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>
        {message}
      </Text>
      {onRetry ? <Button label="Retry" onPress={onRetry} /> : null}
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
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 16, textAlign: 'center', lineHeight: 22 },
});
