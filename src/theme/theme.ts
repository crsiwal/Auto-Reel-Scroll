import { MD3LightTheme, MD3DarkTheme, useTheme } from 'react-native-paper';

export const themeLight = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',
    secondary: '#625B71',
    tertiary: '#7D5260',
    background: '#FEF7FF',
    surface: '#F7F2FA',
    error: '#B3261E',
    accent: '#03DAC6',
    card: '#FFFFFF',
    text: '#1C1B1F',
    border: '#CAC4D0',
    notification: '#E8DEF8',
  },
};

export const themeDark = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#D0BCFF',
    secondary: '#CCC2DC',
    tertiary: '#EFB8C8',
    background: '#141218',
    surface: '#1D1B20',
    error: '#F2B8B5',
    accent: '#03DAC6',
    card: '#252329',
    text: '#E6E1E5',
    border: '#49454F',
    notification: '#381E72',
  },
};

export type AppTheme = typeof themeLight;

export const useAppTheme = () => useTheme<AppTheme>();

