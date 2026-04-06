import { MD3LightTheme } from 'react-native-paper';
import { colors } from '../constants/colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
    outline: colors.border,
  },
};
