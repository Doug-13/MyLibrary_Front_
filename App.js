// App.js
import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Routes from './routes';
import { AuthProvider } from './context/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';

function AppShell() {
  const { navTheme, theme, paperTheme } = useContext(ThemeContext);
  const barStyle = navTheme.dark ? 'light-content' : 'dark-content';

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar backgroundColor={theme.bg} barStyle={barStyle} />
          <AuthProvider>
            <Routes />
          </AuthProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppShell />
    </ThemeProvider>
  );
}
