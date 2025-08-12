import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import Login from '../src/pages/Login/login.js';
import Register from '../src/pages/Register';
import ForgotPassword from '../src/pages/ForgotPassword';
import MainScreen from '../src/pages/MainScreen';
import OnboardingScreens from '../src/pages/OnboardingScreens/index.js';

// Ativa otimizações de navegação nativa (melhor uso de memória e performance)
enableScreens(true);

const AuthStack = createNativeStackNavigator();

function AuthRoutes() {
  return (
    <AuthStack.Navigator
      initialRouteName="OnboardingScreens"
      screenOptions={{
        headerShown: false,
        // animação padrão entre telas de auth
        animation: 'slide_from_right',
        // performance: congela e destaca telas fora de foco
        freezeOnBlur: true,
        detachInactiveScreens: true,
        // pequenas suavizações de gesto
        gestureEnabled: true,
        // evita "flash" branco em transições rápidas
        animationDuration: 250,
      }}
    >
      <AuthStack.Screen
        name="OnboardingScreens"
        component={OnboardingScreens}
        options={{
          // Onboarding como modal de tela cheia e transição mais sutil
          presentation: 'fullScreenModal',
          animation: 'fade',
          // normalmente não queremos voltar para trás durante o onboarding
          gestureEnabled: false,
        }}
      />

      <AuthStack.Screen
        name="Login"
        component={Login}
        options={{
          animation: 'fade_from_bottom',
        }}
      />

      <AuthStack.Screen
        name="Register"
        component={Register}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          animation: 'slide_from_right',
        }}
      />

      <AuthStack.Screen
        name="MainScreen"
        component={MainScreen}
        options={{
          // ao entrar na app principal, transição discreta
          animation: 'fade',
          // mantém performance caso volte para auth stack em algum cenário
          freezeOnBlur: true,
          detachInactiveScreens: true,
        }}
      />
    </AuthStack.Navigator>
  );
}

export default AuthRoutes;
