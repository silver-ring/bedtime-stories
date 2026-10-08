import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ReaderScreen } from '../../features/reader/screens/ReaderScreen';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs">
        {({ navigation }) => (
          <TabNavigator
            onOpenStory={storyId => navigation.navigate('Reader', { storyId })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Reader">
        {({ route, navigation }) => (
          <ReaderScreen
            storyId={route.params.storyId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
