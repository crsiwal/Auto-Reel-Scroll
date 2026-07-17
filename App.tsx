import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { themeLight, themeDark } from './src/theme/theme';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? themeDark : themeLight;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer theme={theme}>
          <StatusBar
            backgroundColor={theme.colors.background}
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          />
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
