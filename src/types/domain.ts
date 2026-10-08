export type Category = 'fairy-tale-grimm' | 'fairy-tale-andersen' | 'fable';

export type CategoryFilter = Category | 'all';

export interface StorySource {
  /** Collection the text was taken from. */
  collection: string;
  /** Public landing page of the collection. */
  url: string;
  /** Translator credited by the source edition, if any. */
  translator?: string;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  category: Category;
  summary: string;
  paragraphs: string[];
  wordCount: number;
  readingMinutes: number;
  source: StorySource;
}

export type AppErrorCode = 'LOAD_FAILED' | 'NOT_FOUND' | 'UNKNOWN';

export interface AppError {
  code: AppErrorCode;
  message: string;
}

export type LoadStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export type ThemeName = 'system' | 'light' | 'sepia' | 'dark';

export const CATEGORY_LABELS: Record<Category, string> = {
  'fairy-tale-grimm': 'Grimm',
  'fairy-tale-andersen': 'Andersen',
  fable: 'Fables',
};

export const CATEGORIES: readonly Category[] = [
  'fairy-tale-grimm',
  'fairy-tale-andersen',
  'fable',
];
