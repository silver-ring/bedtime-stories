import { act, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { simulateFailureSet } from '../../src/features/settings/devSlice';
import { LibraryScreen } from '../../src/features/stories/screens/LibraryScreen';
import {
  FakeRepository,
  makeTestStore,
  renderWithStore,
} from '../../src/test-utils/renderWithStore';

const HARE = 'The Hare and the Tortoise';

describe('LibraryScreen', () => {
  it('C1: shows the loading state, then the story cards', async () => {
    const { store } = makeTestStore({
      repository: new FakeRepository(undefined, 50),
    });
    await renderWithStore(<LibraryScreen onOpenStory={jest.fn()} />, store);

    expect(screen.getByLabelText('Loading stories')).toBeTruthy();
    expect(await screen.findByText(HARE)).toBeTruthy();
    expect(screen.getByText('The Snow Queen')).toBeTruthy();
    expect(screen.getByText('Hansel and Gretel')).toBeTruthy();
    expect(screen.queryByLabelText('Loading stories')).toBeNull();
  });

  it('C2: shows an error with Retry, and recovers once loading works', async () => {
    const { store } = makeTestStore();
    store.dispatch(simulateFailureSet(true));
    await renderWithStore(<LibraryScreen onOpenStory={jest.fn()} />, store);

    expect(await screen.findByText('Could not load the stories.')).toBeTruthy();

    await act(async () => {
      store.dispatch(simulateFailureSet(false));
    });
    await fireEvent.press(screen.getByLabelText('Retry'));

    expect(await screen.findByText(HARE)).toBeTruthy();
    expect(screen.queryByText('Could not load the stories.')).toBeNull();
  });

  it('C3: a search with no matches shows the empty state, and Clear search restores the list', async () => {
    const { store } = makeTestStore();
    await renderWithStore(<LibraryScreen onOpenStory={jest.fn()} />, store);
    await screen.findByText(HARE);

    await fireEvent.changeText(screen.getByLabelText('Search stories'), 'zzzz');
    expect(await screen.findByText('No stories found')).toBeTruthy();
    expect(screen.queryByText(HARE)).toBeNull();

    await fireEvent.press(screen.getByLabelText('Clear search'));
    expect(await screen.findByText(HARE)).toBeTruthy();
    expect(store.getState().stories.filter.query).toBe('');
  });

  it('filters by category chip', async () => {
    const { store } = makeTestStore();
    await renderWithStore(<LibraryScreen onOpenStory={jest.fn()} />, store);
    await screen.findByText(HARE);

    await fireEvent.press(screen.getByLabelText('Filter: Grimm'));
    expect(screen.getByText('Hansel and Gretel')).toBeTruthy();
    expect(screen.queryByText(HARE)).toBeNull();
  });

  it('C4: the heart toggles the favorite and updates its accessibility state', async () => {
    const { store } = makeTestStore();
    await renderWithStore(<LibraryScreen onOpenStory={jest.fn()} />, store);
    await screen.findByText(HARE);

    await fireEvent.press(screen.getByLabelText(`Add ${HARE} to favorites`));

    expect(store.getState().favorites.ids).toEqual(['hare']);
    const heart = screen.getByLabelText(`Remove ${HARE} from favorites`);
    expect(heart).toBeSelected();
  });

  it('opens a story when its card is pressed', async () => {
    const onOpenStory = jest.fn();
    const { store } = makeTestStore();
    await renderWithStore(<LibraryScreen onOpenStory={onOpenStory} />, store);
    await screen.findByText(HARE);

    await fireEvent.press(screen.getByText(HARE));
    expect(onOpenStory).toHaveBeenCalledWith('hare');
  });

  it('shows a Continue reading card for the most recent unfinished story', async () => {
    const { store } = makeTestStore({
      preloaded: {
        progress: {
          byStoryId: {
            snow: { fraction: 0.4, updatedAt: 10, completed: false },
          },
        },
      },
    });
    const onOpenStory = jest.fn();
    await renderWithStore(<LibraryScreen onOpenStory={onOpenStory} />, store);

    const card = await screen.findByLabelText(
      'Continue reading The Snow Queen, 40 percent read',
    );
    await fireEvent.press(card);
    expect(onOpenStory).toHaveBeenCalledWith('snow');
  });

  it('describes reading progress in the card label, with the heart as its own button', async () => {
    const { store } = makeTestStore({
      preloaded: {
        progress: {
          byStoryId: {
            snow: { fraction: 0.4, updatedAt: 10, completed: false },
            hare: { fraction: 1, updatedAt: 5, completed: true },
          },
        },
      },
    });
    await renderWithStore(<LibraryScreen onOpenStory={jest.fn()} />, store);

    expect(
      await screen.findByLabelText(
        'The Snow Queen by Hans Christian Andersen, 12 minute read, 40 percent read',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(
        'The Hare and the Tortoise by Aesop, 1 minute read, finished',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Add The Snow Queen to favorites'),
    ).toBeTruthy();
  });
});
