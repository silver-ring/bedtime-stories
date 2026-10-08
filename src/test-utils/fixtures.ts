import type { Story } from '../types/domain';

function makeStory(
  overrides: Partial<Story> & Pick<Story, 'id' | 'title'>,
): Story {
  return {
    author: 'Test Author',
    category: 'fable',
    summary: `Summary of ${overrides.title}`,
    paragraphs: ['First paragraph.', 'Second paragraph.'],
    wordCount: 4,
    readingMinutes: 1,
    source: { collection: 'Test Collection', url: 'https://example.test' },
    ...overrides,
  };
}

export const hareStory = makeStory({
  id: 'hare',
  title: 'The Hare and the Tortoise',
  author: 'Aesop',
  category: 'fable',
  summary: 'A slow and steady tortoise wins a race.',
});

export const snowStory = makeStory({
  id: 'snow',
  title: 'The Snow Queen',
  author: 'Hans Christian Andersen',
  category: 'fairy-tale-andersen',
  summary: 'Gerda searches for Kay.',
  readingMinutes: 12,
});

export const hanselStory = makeStory({
  id: 'hansel',
  title: 'Hansel and Gretel',
  author: 'Jacob and Wilhelm Grimm',
  category: 'fairy-tale-grimm',
  summary: 'Two children find a house made of bread.',
  readingMinutes: 15,
});

export const FIXTURE_STORIES: Story[] = [hareStory, snowStory, hanselStory];
