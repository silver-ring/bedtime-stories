import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing } from '../theme/tokens';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';

interface EmptyViewProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyView({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyViewProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: palette.textMuted }]}>
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="secondary" onPress={onAction} />
      ) : null}
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
