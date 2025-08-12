import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import Routes from './routes/index'; // Caminho para suas rotas
import { AuthProvider } from './context/AuthContext'; // Contexto de autenticação
import { SafeAreaProvider } from 'react-native-safe-area-context'; // SafeArea para novas versões


export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AuthProvider>
          <StatusBar backgroundColor="black" barStyle="light-content" />
          <Routes />
        </AuthProvider>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}