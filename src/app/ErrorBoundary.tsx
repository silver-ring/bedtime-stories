import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defense: a render error anywhere below shows a recovery screen
 * instead of a blank app. Uses plain styles because the theme may be what failed.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error.message, info.componentStack);
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Pressable
            onPress={this.reset}
            accessibilityRole="button"
            style={styles.button}
          >
            <Text style={styles.buttonLabel}>Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f6f4ef',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1d2433', marginBottom: 8 },
  message: {
    fontSize: 15,
    color: '#5b6475',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 999,
    backgroundColor: '#3b4cca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
});
