import { NavigationContainer } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { Provider } from 'react-redux';
import {
  loadPersistedState,
  savePersistedState,
} from '../services/persistence';
import { asyncStorageAdapter } from '../services/asyncStorageAdapter';
import type { KeyValueStorage } from '../services/storage';
import {
  BundledStoryRepository,
  type StoryRepository,
} from '../services/storyRepository';
import { ThemeProvider, useTheme } from '../shared/theme/ThemeProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { makeStore, type AppStore } from './store';

interface AppBootstrapProps {
  /** Overridable for tests. */
  storage?: KeyValueStorage;
  repository?: StoryRepository;
}

const DEFAULT_LATENCY_MS = 500;

/**
 * Loads saved state first, then creates the store and renders the app. The
 * store only exists after loading, so defaults can never overwrite saved data.
 */
export function AppBootstrap({
  storage = asyncStorageAdapter,
  repository,
}: AppBootstrapProps) {
  const [store, setStore] = useState<AppStore | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const preloaded = await loadPersistedState(storage);
      if (cancelled) {
        return;
      }
      setStore(
        makeStore(
          {
            storage,
            repository:
              repository ??
              new BundledStoryRepository({ latencyMs: DEFAULT_LATENCY_MS }),
          },
          preloaded,
        ),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [storage, repository]);

  // Write immediately when the app leaves the foreground (the listener
  // middleware debounces normal writes by half a second).
  useEffect(() => {
    if (!store) {
      return;
    }
    const subscription = AppState.addEventListener('change', next => {
      if (next !== 'active') {
        savePersistedState(storage, store.getState());
      }
    });
    return () => subscription.remove();
  }, [store, storage]);

  if (!store) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </Provider>
  );
}

function AppShell() {
  const { navigationTheme, isDark } = useTheme();
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f6f4ef',
  },
});
