import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppBootstrap } from './src/app/AppBootstrap';
import { ErrorBoundary } from './src/app/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppBootstrap />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
