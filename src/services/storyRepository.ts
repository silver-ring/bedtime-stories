import { STORIES } from '../data/stories';
import type { AppError, Story } from '../types/domain';

export interface GetStoriesOptions {
  /** Developer toggle: make the call fail so the error UI can be demonstrated. */
  simulateFailure?: boolean;
}

export interface StoryRepository {
  getStories(options?: GetStoriesOptions): Promise<Story[]>;
}

export interface BundledStoryRepositoryOptions {
  /** Artificial latency so loading states are visible. Use 0 in tests. */
  latencyMs: number;
  stories?: readonly Story[];
}

const wait = (ms: number) =>
  ms > 0
    ? new Promise<void>(resolve => setTimeout(resolve, ms))
    : Promise.resolve();

/**
 * Serves the stories bundled with the app. The latency and failure switch
 * stand in for a network so the async and error paths behave like a real API.
 */
export class BundledStoryRepository implements StoryRepository {
  private readonly latencyMs: number;
  private readonly stories: readonly Story[];

  constructor({ latencyMs, stories = STORIES }: BundledStoryRepositoryOptions) {
    this.latencyMs = latencyMs;
    this.stories = stories;
  }

  async getStories(options: GetStoriesOptions = {}): Promise<Story[]> {
    await wait(this.latencyMs);
    if (options.simulateFailure) {
      const error: AppError = {
        code: 'LOAD_FAILED',
        message: 'Could not load the stories. Please try again.',
      };
      throw error;
    }
    return [...this.stories];
  }
}
