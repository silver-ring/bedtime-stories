import React, { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function ScreenContainer({ children }: { children: ReactNode }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
