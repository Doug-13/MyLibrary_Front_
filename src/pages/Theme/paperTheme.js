// src/theme/paperTheme.js
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { LightTheme, DarkTheme } from './index';

// ---- shim de fontes MD2 (regular/medium/light/thin) ----
const legacyFonts = {
  regular: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      default: 'System',
    }),
    fontWeight: '400',
  },
  medium: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-medium',
      default: 'System',
    }),
    // no Android o "medium" costuma ser 'normal' na família -medium
    fontWeight: Platform.OS === 'android' ? 'normal' : '500',
  },
  light: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-light',
      default: 'System',
    }),
    fontWeight: '300',
  },
  thin: {
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif-thin',
      default: 'System',
    }),
    fontWeight: '100',
  },
};

export const PaperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: LightTheme.primary,
    secondary: LightTheme.secondary,
    background: LightTheme.bg,
    surface: LightTheme.card,
    surfaceVariant: LightTheme.card,
    onSurface: LightTheme.text,
    onSurfaceVariant: LightTheme.textSecondary,
    outline: LightTheme.border,
    error: LightTheme.error,
  },
  // mantém a tipografia MD3 e adiciona as chaves MD2
  fonts: { ...MD3LightTheme.fonts, ...legacyFonts },
};

export const PaperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: DarkTheme.primary,
    secondary: DarkTheme.secondary,
    background: DarkTheme.bg,
    surface: DarkTheme.card,
    surfaceVariant: DarkTheme.card,
    onSurface: DarkTheme.text,
    onSurfaceVariant: DarkTheme.textSecondary,
    outline: DarkTheme.border,
    error: DarkTheme.error,
  },
  fonts: { ...MD3DarkTheme.fonts, ...legacyFonts },
};
