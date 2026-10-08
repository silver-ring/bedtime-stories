export type ResolvedTheme = 'light' | 'sepia' | 'dark';

export interface Palette {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
  onAccent: string;
  danger: string;
  chip: string;
  chipText: string;
}

export const palettes: Record<ResolvedTheme, Palette> = {
  light: {
    background: '#f6f4ef',
    surface: '#ffffff',
    text: '#1d2433',
    textMuted: '#5b6475',
    border: '#e1ddd3',
    accent: '#3b4cca',
    onAccent: '#ffffff',
    danger: '#b3261e',
    chip: '#e9e8f7',
    chipText: '#2b3590',
  },
  sepia: {
    background: '#f1e6cf',
    surface: '#f8efdc',
    text: '#3e2f1c',
    textMuted: '#6f5a3d',
    border: '#dcc9a3',
    accent: '#8a4b14',
    onAccent: '#fff8ec',
    danger: '#a3321f',
    chip: '#e6d4ae',
    chipText: '#5f3a10',
  },
  dark: {
    background: '#11141c',
    surface: '#1b2030',
    text: '#e8eaf0',
    textMuted: '#9aa3b5',
    border: '#2b3246',
    accent: '#8c9bff',
    onAccent: '#11141c',
    danger: '#ff8a80',
    chip: '#262d45',
    chipText: '#c5ccff',
  },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 14, pill: 999 } as const;
export const READER_BASE_FONT_SIZE = 18;
export const READER_LINE_HEIGHT_RATIO = 1.6;
