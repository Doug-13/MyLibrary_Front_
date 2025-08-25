  import React, { useState, useContext } from 'react';
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
    Alert,
    SafeAreaView,
  } from 'react-native';
  import { useNavigation } from '@react-navigation/native';
  import { AuthContext } from '../../../context/AuthContext.js';
  import Feather from 'react-native-vector-icons/Feather';

  import { auth } from '../../firebase/firebase.config.js';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import axios from 'axios';
  // import colors from '../../../constants/colors.js';
  import { API_BASE_URL } from '../../config/api.js';

  const api = axios.create({
    baseURL: API_BASE_URL,
  });

  export default function Register() {
    const navigation = useNavigation();
    const [userName, setUserName] = useState('');
    const [userMail, setUserMail] = useState('');
    const [userPass, setUserPass] = useState('');
    const [userRePass, setUserRePass] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const { register } = useContext(AuthContext);

    const toggleShowPassword = () => setShowPassword(!showPassword);

    const newUser = async () => {
      if (userMail === '' || userPass === '' || userRePass === '' || userName === '') {
        Alert.alert('Campos obrigatórios', 'Todos os campos devem ser preenchidos');
        return;
      }
      if (userPass !== userRePass) {
        Alert.alert('Atenção', 'A senha e confirmação devem ser iguais');
        return;
      }
      if (userPass.length < 6) {
        Alert.alert('Atenção', 'A senha deve ter pelo menos 6 caracteres');
        return;
      }
      setLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, userMail, userPass);
        const user = userCredential.user;

        const userData = {
          idFirebase: user.uid,
          nome_completo: userName,
          email: userMail,
        };

        const response = await api.post(`${API_BASE_URL}/users`, userData);

        if (response.status === 201) {
          Alert.alert('Sucesso', 'Usuário adicionado com sucesso');
          navigation.goBack();
        } else {
          Alert.alert('Erro', 'Erro ao salvar usuário no banco de dados');
        }
      } catch (error) {
        if (error?.code === 'auth/email-already-in-use') {
          Alert.alert('Atenção', 'Este e-mail já está em uso. Por favor, use outro.');
        } else {
          Alert.alert('Erro', `Erro ao criar usuário: ${error?.message || 'Tente novamente.'}`);
        }
      } finally {
        setLoading(false);
      }
    };

    const onRefresh = () => {
      setRefreshing(true);
      setUserName('');
      setUserMail('');
      setUserPass('');
      setUserRePass('');
      setRefreshing(false);
    };

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND_BG }}>
        <StatusBar barStyle="dark-content" backgroundColor={BRAND_BG} />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              <Text style={styles.headline}>Crie sua conta ✨</Text>
              <Text style={styles.subtitle}>Leve sua biblioteca com você</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {/* Nome */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={20} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Digite seu nome"
                    placeholderTextColor="#8A8A8A"
                    style={styles.input}
                    value={userName}
                    onChangeText={setUserName}
                    returnKeyType="next"
                    accessibilityLabel="Campo de nome completo"
                  />
                </View>
              </View>

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
                    returnKeyType="next"
                    accessibilityLabel="Campo de senha"
                  />
                  <TouchableOpacity
                    onPress={toggleShowPassword}
                    style={styles.trailingIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirmar senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmação de senha</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} style={styles.inputIcon} />
                  <TextInput
                    secureTextEntry={!showPassword}
                    placeholder="Repita sua senha"
                    placeholderTextColor="#8A8A8A"
                    style={styles.input}
                    value={userRePass}
                    onChangeText={setUserRePass}
                    returnKeyType="done"
                    accessibilityLabel="Campo de confirmação de senha"
                  />
                  <TouchableOpacity
                    onPress={toggleShowPassword}
                    style={styles.trailingIconBtn}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <Feather name={showPassword ? 'eye' : 'eye-off'} size={20} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botão */}
              <TouchableOpacity
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={newUser}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Cadastrar"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="user-plus" size={18} color="#fff" style={styles.btnIcon} />
                    <Text style={styles.primaryBtnText}>Cadastrar</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Link voltar */}
              <View style={styles.linksRow}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                  <Text style={styles.linkText}>Já tem conta? Entrar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Rodapé */}
            <Text style={styles.footerNote}>Ao continuar, você concorda com os Termos e a Política</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  /** Paleta e estilos */
  const BRAND_BG = '#a1faf3ff';      // fundo suave (azul claro)
  const TEXT_PRIMARY = '#111111';
  const TEXT_SECONDARY = '#555';
  const SURFACE = '#FFFFFF';
  const BORDER = '#E8E8E8';
  const FIELD_BG = '#F7F7F7';

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: BRAND_BG },
    scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },
    header: { paddingTop: 16, alignItems: 'center' },
    brandRow: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    logo: { width: 220, height: 120, borderRadius: 16 },
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

    primaryBtn: {
      marginTop: 18,
      backgroundColor: '#111111',
      height: 50,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    disabledBtn: { opacity: 0.6 },
    btnIcon: { marginRight: 8 },
    primaryBtnText: { color: '#fff', fontWeight: '700' },

    linksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 16,
    },
    linkText: {
      color: TEXT_PRIMARY,
      textDecorationLine: 'underline',
      fontSize: 14,
    },

    footerNote: {
      textAlign: 'center',
      color: TEXT_SECONDARY,
      fontSize: 12,
      marginTop: 18,
    },
  });

