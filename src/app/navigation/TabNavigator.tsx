import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { FavoritesScreen } from '../../features/favorites/screens/FavoritesScreen';
import { SettingsScreen } from '../../features/settings/screens/SettingsScreen';
import { LibraryScreen } from '../../features/stories/screens/LibraryScreen';
import {
  FavoritesIcon,
  LibraryIcon,
  SettingsIcon,
} from '../../shared/components/TabIcons';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

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
          tabBarIcon: LibraryIcon,
        }}
      >
        {() => <LibraryScreen onOpenStory={onOpenStory} />}
      </Tab.Screen>
      <Tab.Screen name="Favorites" options={{ tabBarIcon: FavoritesIcon }}>
        {() => <FavoritesScreen onOpenStory={onOpenStory} />}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: SettingsIcon }}
      />
    </Tab.Navigator>
  );
}
