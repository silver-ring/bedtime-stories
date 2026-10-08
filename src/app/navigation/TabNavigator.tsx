import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { FavoritesScreen } from '../../features/favorites/screens/FavoritesScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { LibraryScreen } from '../../features/stories/screens/LibraryScreen';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const icon = (glyph: string) =>
  function TabIcon({ color }: { color: string }) {
    return <Text style={[styles.icon, { color }]}>{glyph}</Text>;
  };

export function TabNavigator({
  onOpenStory,
}: {
  onOpenStory: (storyId: string) => void;
}) {
  return (
    <Tab.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Tab.Screen
        name="Library"
        options={{
          title: 'Bedtime Stories',
          tabBarLabel: 'Library',
          tabBarIcon: icon('📚'),
        }}
      >
        {() => <LibraryScreen onOpenStory={onOpenStory} />}
      </Tab.Screen>
      <Tab.Screen name="Favorites" options={{ tabBarIcon: icon('♥') }}>
        {() => <FavoritesScreen onOpenStory={onOpenStory} />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: icon('⚙') }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({ icon: { fontSize: 20 } });
