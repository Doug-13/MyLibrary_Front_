import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../src/pages/Login/login.js';
import Register from '../src/pages/Register';
import ForgotPassword from '../src/pages/ForgotPassword';
import MainScreen from '../src/pages/MainScreen';
import OnboardingScreens from '../src/pages/OnboardingScreens/index.js';

const AuthStack = createNativeStackNavigator();

function AuthRoutes() {
    return (
        <AuthStack.Navigator>
            <AuthStack.Screen
                name='OnboardingScreens' // Exibe o onboarding sempre
                component={OnboardingScreens}
                options={{ headerShown: false }} // Remove o cabeçalho
            />
            <AuthStack.Screen
                name='Login'
                component={Login}
                options={{ headerShown: false }}
            />
            <AuthStack.Screen
                name='Register'
                component={Register}
                options={{ headerShown: false }}
            />
            <AuthStack.Screen
                name='ForgotPassword'
                component={ForgotPassword}
                options={{ headerShown: false }}
            />
            <AuthStack.Screen
                name='MainScreen'
                component={MainScreen}
                options={{ headerShown: false }}
            />
        </AuthStack.Navigator>
    );
}

export default AuthRoutes;
