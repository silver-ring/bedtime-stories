import { act, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { progressUpdated } from '../../src/features/progress/progressSlice';
import { ReaderScreen } from '../../src/features/reader/screens/ReaderScreen';
import { fetchStories } from '../../src/features/stories/storiesSlice';
import { palettes } from '../../src/shared/theme/tokens';
import type { PersistedSlices } from '../../src/services/persistence';
import {
  makeTestStore,
  renderWithStore,
} from '../../src/test-utils/renderWithStore';

async function loadedStore(preloaded?: Partial<PersistedSlices>) {
  const made = makeTestStore({ preloaded });
  await made.store.dispatch(fetchStories());
  return made.store;
}

function metrics(y: number, content: number, viewport: number) {
  return {
    nativeEvent: {
      contentOffset: { x: 0, y },
      contentSize: { width: 390, height: content },
      layoutMeasurement: { width: 390, height: viewport },
    },
  };
}

async function layOut(content: number, viewport: number) {
  const scroll = screen.getByTestId('reader-scroll');
  await fireEvent(scroll, 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 390, height: viewport } },
  });
  await fireEvent(scroll, 'contentSizeChange', 390, content);
  return scroll;
}

describe('ReaderScreen', () => {
  it('C5: the font size buttons rescale the text and the theme buttons recolor it', async () => {
    const store = await loadedStore();
    await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );

    const paragraph = screen.getByText('First paragraph.');
    expect(paragraph).toHaveStyle({ fontSize: 18 });

    await fireEvent.press(screen.getByLabelText('Reading settings'));
    await fireEvent.press(screen.getByLabelText('Increase text size'));
    expect(store.getState().readerSettings.fontScale).toBe(1.15);
    expect(screen.getByText('First paragraph.')).toHaveStyle({
      fontSize: 18 * 1.15,
    });

    await fireEvent.press(screen.getByLabelText('Dark theme'));
    expect(store.getState().readerSettings.theme).toBe('dark');
    expect(screen.getByText('First paragraph.')).toHaveStyle({
      color: palettes.dark.text,
    });

    await fireEvent.press(screen.getByLabelText('Sepia theme'));
    expect(screen.getByText('First paragraph.')).toHaveStyle({
      color: palettes.sepia.text,
    });
  });

  it('C6: an unknown story id shows Story not found and can go back', async () => {
    const onBack = jest.fn();
    const store = await loadedStore();
    await renderWithStore(
      <ReaderScreen storyId="nope" onBack={onBack} />,
      store,
    );

    expect(screen.getByText('Story not found')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Back to library'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows a loading view while the stories have not loaded yet', async () => {
    const { store } = makeTestStore();
    await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );
    expect(screen.getByLabelText('Loading stories')).toBeTruthy();
  });

  it('C7: saves scroll progress as a fraction when scrolling ends', async () => {
    const store = await loadedStore();
    await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );

    const scroll = await layOut(2000, 500);
    await fireEvent.scroll(scroll, metrics(750, 2000, 500));
    await fireEvent(scroll, 'momentumScrollEnd');

    expect(store.getState().progress.byStoryId.hare?.fraction).toBeCloseTo(0.5);
    expect(store.getState().progress.byStoryId.hare?.completed).toBe(false);
  });

  it('C7: saves on unmount', async () => {
    const store = await loadedStore();
    const view = await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );

    const scroll = await layOut(2000, 500);
    await fireEvent.scroll(scroll, metrics(1500, 2000, 500));
    await act(async () => {
      view.unmount();
    });

    expect(store.getState().progress.byStoryId.hare).toMatchObject({
      fraction: 1,
      completed: true,
    });
  });

  it('C7: content that fits on screen counts as read', async () => {
    const store = await loadedStore();
    await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );

    await layOut(300, 800);

    expect(store.getState().progress.byStoryId.hare).toMatchObject({
      fraction: 1,
      completed: true,
    });
  });

  it('restores the saved position into the progress bar', async () => {
    const store = await loadedStore({
      progress: {
        byStoryId: { hare: { fraction: 0.5, updatedAt: 1, completed: false } },
      },
    });
    await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );

    await layOut(2000, 500);

    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
      now: 50,
    });
  });

  it('never overwrites saved progress when it is closed before layout', async () => {
    const store = await loadedStore({
      progress: {
        byStoryId: { hare: { fraction: 0.7, updatedAt: 1, completed: false } },
      },
    });
    const view = await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );
    await act(async () => {
      view.unmount();
    });

    expect(store.getState().progress.byStoryId.hare?.fraction).toBe(0.7);
  });

  it('a finished story reopens from the top', async () => {
    const store = await loadedStore();
    store.dispatch(progressUpdated({ id: 'hare', fraction: 1 }));
    await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );

    await layOut(2000, 500);

    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({
      now: 0,
    });
  });

  it('toggles the favorite from the header', async () => {
    const store = await loadedStore();
    await renderWithStore(
      <ReaderScreen storyId="hare" onBack={jest.fn()} />,
      store,
    );

    await fireEvent.press(screen.getByLabelText('Add to favorites'));
    expect(store.getState().favorites.ids).toEqual(['hare']);
    expect(screen.getByLabelText('Remove from favorites')).toBeTruthy();
  });
});
