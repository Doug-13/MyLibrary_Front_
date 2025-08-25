import React, { useEffect, useState, useContext } from 'react';
import {
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Platform,
  ScrollView,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';

export default function Login() {
  const navigation = useNavigation();
  const { signIn, loading } = useContext(AuthContext);
  const [userMail, setUserMail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '920349589094-v6t2gasjo44s877lo0mp1tm9krbldok5.apps.googleusercontent.com',
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
  }, []);

  const handleSignIn = async () => {
    if (!userMail || !userPass) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    try {
      // ❗️Não passe navigation aqui. O AuthContext deve apenas logar; o Routes troca a pilha.
      await signIn(userMail, userPass);
      setErrorMessage('');
    } catch (error) {
      if (error?.code) {
        switch (error.code) {
          case 'auth/invalid-email':
            setErrorMessage('E-mail inválido. Por favor, insira um e-mail válido.');
            break;
          case 'auth/user-not-found':
            setErrorMessage('Usuário não cadastrado. Favor realizar seu cadastro.');
            break;
          case 'auth/wrong-password':
            setErrorMessage('Senha incorreta. Verifique e tente novamente.');
            break;
          case 'auth/invalid-credential':
            setErrorMessage('As credenciais fornecidas são inválidas. Verifique as informações.');
            break;
          default:
            setErrorMessage('Ocorreu um erro inesperado. Tente novamente mais tarde.');
        }
      } else {
        setErrorMessage('Erro inesperado. Tente novamente.');
      }
    }
  };

  async function googleSignIn() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      await GoogleSignin.signIn(); // seletor de contas Google
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) throw new Error('Sem idToken do Google');

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);
      const user = userCredential.user;

      // ❗️Não navegue manualmente. O listener onAuthStateChanged ajusta 'signed' e o Routes troca para AppRoutes.
      // navigation.replace('HomeScreen');
      console.log('=> Google sign-in OK', user.uid, user.email);
      setErrorMessage('');
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Usuário cancelou o login');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login em andamento...');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMessage('Atualize o Google Play Services no dispositivo.');
      } else {
        console.log('=> GoogleSignIn Error', error);
        setErrorMessage('Falha ao entrar com Google. Verifique SHAs e webClientId.');
      }
    }
  }

  const onRefresh = () => {
    setUserMail('');
    setUserPass('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3d00f' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#a1faf3ff" />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#000" />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image
                source={require('../../../assets/logo_Preto.png')}
                style={styles.logo}
                resizeMode="contain"
                accessible
                accessibilityLabel="Logo do aplicativo"
              />
            </View>
            <Text style={styles.headline}>Bem-vindo de volta 👋</Text>
            <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} style={styles.inputIcon} />
                <TextInput
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#8A8A8A"
                  style={styles.input}
                  value={userMail}
                  onChangeText={setUserMail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  accessibilityLabel="Campo de e-mail"
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputWrapper}>
                <Feather name="lock" size={20} style={styles.inputIcon} />
                <TextInput
                  secureTextEntry={!showPassword}
                  placeholder="Digite sua senha"
                  placeholderTextColor="#8A8A8A"
                  style={styles.input}
                  value={userPass}
                  onChangeText={setUserPass}
                  returnKeyType="done"
                  accessibilityLabel="Campo de senha"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.trailingIconBtn}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Erro */}
            {!!errorMessage && (
              <View style={styles.errorBox} accessible accessibilityLiveRegion="polite">
                <Feather name="alert-triangle" size={18} color="#B42318" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Ações */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleSignIn}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Entrar"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="log-in" size={18} color="#fff" style={styles.btnIcon} />
                  <Text style={styles.primaryBtnText}>Acessar</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View className="divider" style={styles.divider} />
              <Text style={styles.dividerText}>ou</Text>
              <View className="divider" style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.googleBtn}
              onPress={googleSignIn}
              accessibilityRole="button"
              accessibilityLabel="Entrar com Google"
            >
              <View style={styles.googleMonogram}>
                <Text style={styles.googleMonogramText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Entrar com Google</Text>
            </TouchableOpacity>

            {/* Links */}
            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <Text style={styles.linkText}>Esqueci a senha</Text>
              </TouchableOpacity>
              <View style={{ width: 16 }} />
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rodapé */}
          <Text style={styles.footerNote}>Versão segura • Seus dados estão protegidos</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// 
const BRAND_YELLOW = '#f9f5a2ff';
// const BRAND_YELLOW = '#a1faf3ff';
const TEXT_PRIMARY = '#111111';
const TEXT_SECONDARY = '#555';
const SURFACE = '#FFFFFF';
const BORDER = '#E8E8E8';
const FIELD_BG = '#F7F7F7';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_YELLOW },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
  header: { paddingTop: 16, alignItems: 'center' },
  brandRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logo: { width: 220, height: 150, borderRadius: 16 },
  headline: { fontSize: 24, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 4 },
  subtitle: { fontSize: 14, color: TEXT_SECONDARY, marginTop: 4 },

  card: {
    backgroundColor: SURFACE,
    marginTop: 16,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  inputGroup: { marginTop: 14 },
  label: { fontSize: 14, color: TEXT_PRIMARY, marginBottom: 8, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FIELD_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8, color: '#444' },
  input: { flex: 1, color: TEXT_PRIMARY, fontSize: 16 },

  trailingIconBtn: { padding: 6, marginLeft: 8 },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE4E2',
    borderWidth: 1,
    borderColor: '#FECDCA',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  errorText: { color: '#B42318', flex: 1, marginLeft: 8 },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: '#111111',
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primaryBtnText: { color: '#FFFFFF', fontWeight: '700' },
  disabledBtn: { opacity: 0.6 },
  btnIcon: { marginRight: 8 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 14 },
  divider: { flex: 1, height: 1, backgroundColor: BORDER },
  dividerText: { marginHorizontal: 10, color: TEXT_SECONDARY, fontSize: 12 },

  googleBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor:"#B42318",
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  googleMonogram: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  googleMonogramText: { fontWeight: '700', color: '#000' },
  googleBtnText: { fontWeight: '700', color: SURFACE },

  linksRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  linkText: { color: TEXT_PRIMARY, textDecorationLine: 'underline', fontSize: 14 },

  footerNote: { textAlign: 'center', color: TEXT_SECONDARY, fontSize: 12, marginTop: 18 },
});



