import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AppSelectionScreen } from '../screens/AppSelectionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

export type RootStackParamList = {
  Dashboard: undefined;
  AppSelection: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        cardStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Auto Reel Scroll' }}
      />
      <Stack.Screen
        name="AppSelection"
        component={AppSelectionScreen}
        options={{ title: 'Select Target App' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
}
