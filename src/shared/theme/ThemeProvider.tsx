import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from '@react-navigation/native';
import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme, type ColorSchemeName } from 'react-native';
import { useAppSelector } from '../../app/hooks';
import type { ThemeName } from '../../types/domain';
import { palettes, type Palette, type ResolvedTheme } from './tokens';

export interface ThemeValue {
  resolved: ResolvedTheme;
  palette: Palette;
  isDark: boolean;
  navigationTheme: NavigationTheme;
}

/** Turns the user's choice into a concrete theme; 'system' follows the device. */
export function resolveTheme(
  choice: ThemeName,
  systemScheme: ColorSchemeName | null | undefined,
): ResolvedTheme {
  if (choice !== 'system') {
    return choice;
  }
  // useColorScheme can return null or undefined; treat both as light.
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function buildTheme(resolved: ResolvedTheme): ThemeValue {
  const palette = palettes[resolved];
  const isDark = resolved === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    resolved,
    palette,
    isDark,
    navigationTheme: {
      ...base,
      colors: {
        ...base.colors,
        primary: palette.accent,
        background: palette.background,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
        notification: palette.danger,
      },
    },
  };
}

const ThemeContext = createContext<ThemeValue>(buildTheme('light'));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const choice = useAppSelector(state => state.readerSettings.theme);
  const scheme = useColorScheme();
  const value = useMemo(
    () => buildTheme(resolveTheme(choice, scheme)),
    [choice, scheme],
  );
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
