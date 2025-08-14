// routes/authRoutes.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

import Login from '../src/pages/Login/login.js';
import Register from '../src/pages/Register';
import ForgotPassword from '../src/pages/ForgotPassword';
import OnboardingScreens from '../src/pages/OnboardingScreens/index.js';

// Ativa otimizações nativas
enableScreens(true);

const AuthStack = createNativeStackNavigator();

function AuthRoutes({ initialRoute = 'Login' }) {
  return (
    <AuthStack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        freezeOnBlur: true,
        detachInactiveScreens: true,
        gestureEnabled: true,
        animationDuration: 250,
      }}
    >
      <AuthStack.Screen
        name="OnboardingScreens"
        component={OnboardingScreens}
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: false,
        }}
      />

      <AuthStack.Screen
        name="Login"
        component={Login}
        options={{ animation: 'fade_from_bottom' }}
      />

      <AuthStack.Screen
        name="Register"
        component={Register}
        options={{ animation: 'slide_from_right' }}
      />

      <AuthStack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ animation: 'slide_from_right' }}
      />
    </AuthStack.Navigator>
  );
}

export default AuthRoutes;
