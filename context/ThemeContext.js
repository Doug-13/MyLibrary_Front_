// context/ThemeContext.js
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, Platform } from 'react-native';

// 🔹 Cores base do app (Light/Dark)
import { LightTheme as ColorsLight, DarkTheme as ColorsDark } from '../src/pages/Theme'; // <- index.js

// 🔹 Temas do react-native-paper (MD3)
import { PaperLightTheme, PaperDarkTheme } from '../src/pages/Theme/paperTheme';

const STORAGE_KEY = 'settings.themeMode'; // 'light' | 'dark' | 'system'

/** Shim de fontes para evitar "Cannot read property 'medium' of undefined"
 *  Alguns componentes do React Navigation esperam theme.fonts.medium.
 */
const legacyFonts = {
  regular: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
    fontWeight: '400',
  },
  medium: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
    fontWeight: Platform.OS === 'android' ? 'normal' : '500',
  },
  light: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-light', default: 'System' }),
    fontWeight: '300',
  },
  thin: {
    fontFamily: Platform.select({ ios: 'System', android: 'sans-serif-thin', default: 'System' }),
    fontWeight: '100',
  },
};

// Fallbacks seguros caso os imports de tema de cores não existam
const FALLBACK_LIGHT = ColorsLight ?? {
  primary: '#F3D00F',
  secondary: '#4E8CFF',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2D3436',
  textSecondary: '#636E72',
  label: '#B2BEC3',
  border: '#E0E0E0',
  error: '#DC3545',
  success: '#28A745',
};
const FALLBACK_DARK = ColorsDark ?? {
  primary: '#F3D00F',
  secondary: '#4E8CFF',
  bg: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  label: '#888888',
  border: '#2C2C2C',
  error: '#DC3545',
  success: '#28A745',
};

// Valor inicial do contexto (evita undefined em usos fora do Provider)
export const ThemeContext = createContext({
  mode: 'system',                     // 'light' | 'dark' | 'system'
  theme: FALLBACK_LIGHT,              // paleta para StyleSheet
  navTheme: { dark: false, colors: {}, fonts: legacyFonts }, // NavigationContainer
  paperTheme: PaperLightTheme,        // react-native-paper
  setMode: (_next) => {},
});

const resolveSystem = () =>
  (Appearance.getColorScheme?.() === 'dark' ? 'dark' : 'light');

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('system');             // preferência do usuário
  const [systemScheme, setSystemScheme] = useState(resolveSystem()); // tema atual do SO

  // Observa mudanças do tema do sistema
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub?.remove?.();
  }, []);

  // Carrega preferência salva
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === 'light' || saved === 'dark' || saved === 'system') {
          setMode(saved);
        }
      } catch {}
    })();
  }, []);

  // Resolve modo efetivo (system -> light/dark)
  const effectiveMode = mode === 'system' ? systemScheme : mode;
  const isDark = effectiveMode === 'dark';

  // Paleta do app (cores) com fallback seguro
  const theme = isDark ? FALLBACK_DARK : FALLBACK_LIGHT;

  // Tema do Paper (MD3)
  const paperTheme = isDark ? PaperDarkTheme : PaperLightTheme;

  // Tema do React Navigation — inclui cores + shim de fontes
  const navTheme = useMemo(
    () => ({
      dark: isDark,
      colors: {
        primary: theme.primary,
        background: theme.bg,
        card: theme.card,
        text: theme.text,
        border: theme.border,
        notification: theme.primary,
      },
      // 👇 evita crashes em libs que esperam theme.fonts.medium
      fonts: legacyFonts,
    }),
    [isDark, theme]
  );

  // Persiste seleção do usuário
  const setModePersist = useCallback(async (next) => {
    setMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      mode,
      theme,       // use em StyleSheet.create
      navTheme,    // passe no <NavigationContainer theme={navTheme} />
      paperTheme,  // passe no <PaperProvider theme={paperTheme} />
      setMode: setModePersist,
    }),
    [mode, theme, navTheme, paperTheme, setModePersist]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export default ThemeProvider;
