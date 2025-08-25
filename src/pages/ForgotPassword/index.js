import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../firebase/firebase.config.js';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';

export default function ForgotPassword() {
  const [userMail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  function replacePass() {
    if (userMail !== '') {
      setLoading(true);
      sendPasswordResetEmail(auth, userMail)
        .then(() => {
          Alert.alert(
            'E-mail enviado',
            'Enviamos instruções de redefinição para o seu e-mail.'
          );
          navigation.goBack();
        })
        .catch((error) => {
          const errorMessage = error?.message || 'Tente novamente.';
          Alert.alert('Ops', 'Algo não deu certo. ' + errorMessage);
        })
        .finally(() => setLoading(false));
    } else {
      Alert.alert(
        'Atenção',
        'Informe um e-mail válido para redefinir a senha.'
      );
    }
  }

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
            <Text style={styles.headline}>Redefinir senha 🔐</Text>
            <Text style={styles.subtitle}>
              Informe seu e-mail para receber as instruções
            </Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputWrapper}>
                <Feather name="mail" size={20} style={styles.inputIcon} />
                <TextInput
                  placeholder="Digite seu e-mail"
                  placeholderTextColor="#8A8A8A"
                  style={styles.input}
                  value={userMail}
                  onChangeText={setUserEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  accessibilityLabel="Campo de e-mail"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={replacePass}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Enviar instruções por e-mail"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#fff" style={styles.btnIcon} />
                  <Text style={styles.primaryBtnText}>Enviar Instruções</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.linksRow}>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.linkText}>Voltar para o login</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerNote}>
            Verifique também a caixa de spam ou promoções
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Paleta consistente com as outras telas */
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
  logo: { width: 220, height: 150, borderRadius: 16 },
  headline: { fontSize: 24, fontWeight: '700', color: TEXT_PRIMARY, marginTop: 4 },
  subtitle: { fontSize: 14, color: TEXT_SECONDARY, marginTop: 4, textAlign: 'center' },

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

