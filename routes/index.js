// routes/index.js
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import LottieView from 'lottie-react-native';
import AppRoutes from './drawerRoutes';
import AuthRoutes from './authRoutes';

function Routes() {
  const { signed, loading } = useContext(AuthContext);
  const [firstLaunch, setFirstLaunch] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const already = await AsyncStorage.getItem('firstLaunch');
        if (already === null) {
          await AsyncStorage.setItem('firstLaunch', 'true');
          setFirstLaunch(true);
        } else {
          setFirstLaunch(false);
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
        <LottieView source={require('../assets/animation2.json')} autoPlay loop style={{ width: 200, height: 200 }} />
        <Text style={styles.loadingText}>Carregando, aguarde...</Text>
      </View>
    );
  }

  if (signed) return <AppRoutes />;

  // ✅ Primeira vez: abre AuthStack começando no Onboarding
  return <AuthRoutes initialRoute={firstLaunch ? 'OnboardingScreens' : 'Login'} />;
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f5f5f5" },
  loadingText: { marginTop: 10, fontSize: 16, color: "#3F51B5", textAlign: "center", fontWeight: "500" },
});

export default Routes;
