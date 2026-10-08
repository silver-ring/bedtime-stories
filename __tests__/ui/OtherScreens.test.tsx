import { act, fireEvent, screen } from '@testing-library/react-native';
import React from 'react';
import { Alert, Text } from 'react-native';
import { ErrorBoundary } from '../../src/app/ErrorBoundary';
import { FavoritesScreen } from '../../src/features/favorites/screens/FavoritesScreen';
import { toggleFavorite } from '../../src/features/favorites/favoritesSlice';
import { progressUpdated } from '../../src/features/progress/progressSlice';
import { SettingsScreen } from '../../src/features/settings/screens/SettingsScreen';
import { fetchStories } from '../../src/features/stories/storiesSlice';
import { buildTheme, resolveTheme } from '../../src/shared/theme/ThemeProvider';
import { palettes } from '../../src/shared/theme/tokens';
import {
  FakeRepository,
  makeTestStore,
  renderWithStore,
} from '../../src/test-utils/renderWithStore';

describe('FavoritesScreen', () => {
  it('C8: shows an empty state, then the favorited stories', async () => {
    const { store } = makeTestStore();
    await store.dispatch(fetchStories());
    await renderWithStore(<FavoritesScreen onOpenStory={jest.fn()} />, store);
    expect(screen.getByText('No favorites yet')).toBeTruthy();

    await act(async () => {
      store.dispatch(toggleFavorite('snow'));
    });
    expect(screen.getByText('The Snow Queen')).toBeTruthy();
    expect(screen.queryByText('No favorites yet')).toBeNull();
  });
});

describe('SettingsScreen', () => {
  afterEach(() => jest.restoreAllMocks());

  it('C9: the failure switch makes the next reload fail, and turning it off recovers', async () => {
    const repository = new FakeRepository();
    const { store } = makeTestStore({ repository });
    await renderWithStore(<SettingsScreen />, store);

    await fireEvent(
      screen.getByLabelText('Simulate load failure'),
      'valueChange',
      true,
    );
    expect(store.getState().dev.simulateFailure).toBe(true);

    await fireEvent.press(screen.getByLabelText('Reload stories'));
    await screen.findByLabelText('Reload stories');
    expect(repository.calls.at(-1)).toEqual({ simulateFailure: true });
    expect(store.getState().stories.status).toBe('failed');

    await fireEvent(
      screen.getByLabelText('Simulate load failure'),
      'valueChange',
      false,
    );
    await fireEvent.press(screen.getByLabelText('Reload stories'));
    await screen.findByLabelText('Reload stories');
    expect(repository.calls.at(-1)).toEqual({ simulateFailure: false });
  });

  it('resets reading progress only after confirming, and keeps favorites', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { store } = makeTestStore();
    store.dispatch(progressUpdated({ id: 'hare', fraction: 0.5 }));
    store.dispatch(toggleFavorite('hare'));
    await renderWithStore(<SettingsScreen />, store);

    await fireEvent.press(screen.getByLabelText('Reset reading progress'));
    expect(Object.keys(store.getState().progress.byStoryId)).toEqual(['hare']);

    const buttons = alert.mock.calls[0]?.[2] ?? [];
    buttons.find(button => button.text === 'Reset')?.onPress?.();
    expect(store.getState().progress.byStoryId).toEqual({});
    expect(store.getState().favorites.ids).toEqual(['hare']);
  });

  it('changes the theme and font size', async () => {
    const { store } = makeTestStore();
    await renderWithStore(<SettingsScreen />, store);

    await fireEvent.press(screen.getByLabelText('Dark theme'));
    expect(store.getState().readerSettings.theme).toBe('dark');
    await fireEvent.press(screen.getByLabelText('Increase text size'));
    expect(store.getState().readerSettings.fontScale).toBe(1.15);
    await fireEvent.press(screen.getByLabelText('Decrease text size'));
    expect(store.getState().readerSettings.fontScale).toBe(1);
  });
});

describe('ErrorBoundary', () => {
  it('C10: shows a fallback when a child throws and recovers after Try again', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    function Bomb() {
      if (shouldThrow) {
        throw new Error('kaboom');
      }
      return <Text>all good</Text>;
    }

    await renderWithStore(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('kaboom')).toBeTruthy();

    shouldThrow = false;
    await fireEvent.press(screen.getByText('Try again'));
    expect(screen.getByText('all good')).toBeTruthy();
    error.mockRestore();
  });
});

describe('theme resolution', () => {
  it('C11: system follows the device, and null or undefined count as light', () => {
    expect(resolveTheme('system', 'dark')).toBe('dark');
    expect(resolveTheme('system', 'light')).toBe('light');
    expect(resolveTheme('system', null)).toBe('light');
    expect(resolveTheme('system', undefined)).toBe('light');
  });

  it('C11: an explicit choice wins over the device setting', () => {
    expect(resolveTheme('sepia', 'dark')).toBe('sepia');
    expect(resolveTheme('light', 'dark')).toBe('light');
    expect(resolveTheme('dark', 'light')).toBe('dark');
  });

  it('C11: builds the matching palette and navigation colors', () => {
    const dark = buildTheme('dark');
    expect(dark.isDark).toBe(true);
    expect(dark.palette).toBe(palettes.dark);
    expect(dark.navigationTheme.colors.background).toBe(
      palettes.dark.background,
    );
    expect(buildTheme('sepia').isDark).toBe(false);
  });
});
