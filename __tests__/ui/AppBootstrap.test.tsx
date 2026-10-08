import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBootstrap } from '../../src/app/AppBootstrap';
import { STORAGE_KEY, STORAGE_VERSION } from '../../src/services/persistence';
import { createMemoryStorage } from '../../src/services/storage';
import { FakeRepository } from '../../src/test-utils/renderWithStore';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

describe('AppBootstrap', () => {
  it('restores saved favorites, progress and theme before first render', async () => {
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({
        version: STORAGE_VERSION,
        favorites: { ids: ['hare'] },
        progress: {
          byStoryId: {
            snow: { fraction: 0.4, updatedAt: 5, completed: false },
          },
        },
        readerSettings: { fontScale: 1.3, theme: 'dark' },
      }),
    });

    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AppBootstrap storage={storage} repository={new FakeRepository()} />
      </SafeAreaProvider>,
    );

    expect(
      await screen.findByLabelText(
        'Remove The Hare and the Tortoise from favorites',
      ),
    ).toBeTruthy();
    expect(
      screen.getByLabelText('Continue reading The Snow Queen, 40 percent read'),
    ).toBeTruthy();
  });

  it('starts with defaults when nothing is stored', async () => {
    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AppBootstrap
          storage={createMemoryStorage()}
          repository={new FakeRepository()}
        />
      </SafeAreaProvider>,
    );
    expect(
      await screen.findByLabelText(
        'Add The Hare and the Tortoise to favorites',
      ),
    ).toBeTruthy();
    await act(async () => {});
  });

  it('writes immediately when the app goes to the background', async () => {
    let onChange: ((state: AppStateStatus) => void) | undefined;
    const subscription = jest
      .spyOn(AppState, 'addEventListener')
      .mockImplementation((_type, listener) => {
        onChange = listener;
        return { remove: jest.fn() };
      });
    const storage = createMemoryStorage();
    const setItem = jest.spyOn(storage, 'setItem');

    await render(
      <SafeAreaProvider initialMetrics={METRICS}>
        <AppBootstrap storage={storage} repository={new FakeRepository()} />
      </SafeAreaProvider>,
    );
    await fireEvent.press(
      await screen.findByLabelText(
        'Add The Hare and the Tortoise to favorites',
      ),
    );
    // Well inside the 500 ms debounce window: nothing written yet.
    expect(setItem).not.toHaveBeenCalled();

    await act(async () => {
      onChange?.('background');
    });

    expect(setItem).toHaveBeenCalledTimes(1);
    const saved = JSON.parse(storage.dump()[STORAGE_KEY] ?? '{}');
    expect(saved.favorites.ids).toEqual(['hare']);
    subscription.mockRestore();
  });
});
