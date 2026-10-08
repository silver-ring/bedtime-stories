import type { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  Library: undefined;
  Favorites: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  Reader: { storyId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
