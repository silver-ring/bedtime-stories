import { render } from '@testing-library/react-native';
import React, { type ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { makeStore, type AppStore } from '../app/store';
import type { PersistedSlices } from '../services/persistence';
import { createMemoryStorage } from '../services/storage';
import type {
  GetStoriesOptions,
  StoryRepository,
} from '../services/storyRepository';
import { ThemeProvider } from '../shared/theme/ThemeProvider';
import type { Story } from '../types/domain';
import { FIXTURE_STORIES } from './fixtures';

export class FakeRepository implements StoryRepository {
  calls: GetStoriesOptions[] = [];

  constructor(
    private readonly stories: Story[] = FIXTURE_STORIES,
    private readonly delayMs = 0,
  ) {}

  async getStories(options: GetStoriesOptions = {}): Promise<Story[]> {
    this.calls.push(options);
    if (this.delayMs > 0) {
      await new Promise<void>(resolve => setTimeout(resolve, this.delayMs));
    }
    if (options.simulateFailure) {
      throw { code: 'LOAD_FAILED', message: 'Could not load the stories.' };
    }
    return [...this.stories];
  }
}

interface TestStoreOptions {
  repository?: StoryRepository;
  storage?: ReturnType<typeof createMemoryStorage>;
  preloaded?: Partial<PersistedSlices>;
  /** Defaults to 0 so UI tests leave no pending timers behind. */
  saveDebounceMs?: number;
}

export function makeTestStore(options: TestStoreOptions = {}) {
  const repository = options.repository ?? new FakeRepository();
  const storage = options.storage ?? createMemoryStorage();
  const store = makeStore(
    { repository, storage, saveDebounceMs: options.saveDebounceMs ?? 0 },
    options.preloaded,
  );
  return { store, repository, storage };
}

const INITIAL_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

export async function renderWithStore(
  ui: ReactElement,
  store: AppStore = makeTestStore().store,
) {
  const result = await render(
    <SafeAreaProvider initialMetrics={INITIAL_METRICS}>
      <Provider store={store}>
        <ThemeProvider>{ui}</ThemeProvider>
      </Provider>
    </SafeAreaProvider>,
  );
  return { store, ...result };
}
