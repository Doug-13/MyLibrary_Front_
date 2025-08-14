// routes/index.js
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

import { AuthContext } from '../context/AuthContext';
import AppRoutes from './drawerRoutes';      // sua navegação logada
import AuthRoutes from './authRoutes';       // stack de autenticação

function Routes() {
  const { signed, loading } = useContext(AuthContext);
  const [firstLaunch, setFirstLaunch] = useState(null); // null = ainda checando

  useEffect(() => {
    (async () => {
      try {
        const already = await AsyncStorage.getItem('firstLaunch');
        if (already === null) {
          await AsyncStorage.setItem('firstLaunch', 'true');
          setFirstLaunch(true);   // primeira vez
        } else {
          setFirstLaunch(false);  // não é a primeira vez
        }
      } catch (e) {
        console.error('Error checking first launch:', e?.message);
        setFirstLaunch(false);
      }
    })();
  }, []);

  if (loading || firstLaunch === null) {
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

  // Se logado, renderiza a navegação da área logada
  if (signed) {
    return <AppRoutes />;
  }

  // Se não logado, renderiza a stack de auth com a rota inicial adequada
  return (
    <AuthRoutes initialRoute={firstLaunch ? 'OnboardingScreens' : 'Login'} />
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#3F51B5', textAlign: 'center', fontWeight: '500' },
});

export default Routes;
