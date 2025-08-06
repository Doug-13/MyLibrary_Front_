
import React, { useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import OnboardingScreens from '../src/pages/OnboardingScreens';
import AppRoutes from './drawerRoutes'; // Rotas principais do app
import AuthRoutes from './authRoutes'; // Rotas de autenticação (login/registro)

function Routes() {
  const { signed, loading } = useContext(AuthContext);
  const [firstLaunch, setFirstLaunch] = useState(null); // Estado para verificar a primeira inicialização


  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const alreadyLaunched = await AsyncStorage.getItem('firstLaunch');
        if (alreadyLaunched === null) {
          await AsyncStorage.setItem('firstLaunch', 'true');
          setFirstLaunch(true);
        } else {
          setFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error.message);
      }
    };

    checkFirstLaunch();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LottieView
          source={require('../assets/animation2.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text style={styles.loadingText}>Carregando, aguarde...</Text>
      </View>
    );
  }

  if (firstLaunch) {
    return <OnboardingScreens />;
  }

  return signed ? <AppRoutes /> : <AuthRoutes />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#3F51B5",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default Routes;