import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../../../shared/theme/ThemeProvider';
import { radius, spacing } from '../../../shared/theme/tokens';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function SearchBar({ value, onChangeText }: SearchBarProps) {
  const { palette } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: palette.surface, borderColor: palette.border },
      ]}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search stories"
        placeholderTextColor={palette.textMuted}
        accessibilityLabel="Search stories"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        returnKeyType="search"
        style={[styles.input, { color: palette.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  input: { minHeight: 44, fontSize: 16 },
});
