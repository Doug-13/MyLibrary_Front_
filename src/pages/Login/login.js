import React, { useState, useContext } from 'react';
import { StatusBar, ActivityIndicator, KeyboardAvoidingView, View, Text, TouchableOpacity, TextInput, Image, StyleSheet, Platform, ScrollView, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../context/AuthContext.js';
import Feather from 'react-native-vector-icons/Feather';

// import colors from '../../../constants/colors.js';

export default function Login() {
  const navigation = useNavigation();
  const { signIn, loading } = useContext(AuthContext);
  const [userMail, setUserMail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Definido corretamente


  const handleSignIn = async () => {
    if (!userMail || !userPass) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    try {
      console.log('Tentando autenticação...');
      await signIn(userMail, userPass, navigation.navigate);
      setErrorMessage(''); // Limpa a mensagem de erro após sucesso
    } catch (error) {
      console.log('Erro capturado:', error);
      if (error?.code) {
        // Tratar códigos específicos de erro
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
        // Caso o erro não tenha um código conhecido
        setErrorMessage('Erro inesperado. Tente novamente.');
      }
    }
  };

  const onRefresh = () => {
    setUserMail('');
    setUserPass('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.containerHeader}>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/logo_Preto.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.containerForm}>
          <StatusBar style="auto" />
          <Text style={styles.title}>Email</Text>
          <TextInput
            placeholder="Digite seu E-mail..."
            style={styles.input}
            value={userMail}
            onChangeText={setUserMail}
          />
          <Text style={styles.title}>Senha</Text>
          <View style={styles.passwordInputContainer}>
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Digite sua senha..."
              style={[styles.input, styles.passwordInput]}
              value={userPass}
              onChangeText={setUserPass}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.togglePasswordButton}
            >
              <Feather name={showPassword ? 'eye' : 'eye-off'} size={24} color="black" />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={20} color="red" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Acessar</Text>
            )}
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={styles.googleButton}
            // onPress={() => signInWithGoogle(navigation.navigate)}
          >
            <Text style={styles.googleButtonText}>Entrar com Google</Text>
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.buttonRegister}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>Não possui uma conta? Cadastre-se</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonForgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotPasswordText}>Esqueci a Senha</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3d00f', // Cor amarela
  },
  containerHeader: {
    marginTop: '14%',
    marginBottom: '8%',
    justifyContent: 'center',
    alignItems: 'center', // Garante que tudo dentro será centralizado
  },
  welcome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red', // Cor vermelha
    marginVertical: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginLeft: 5,
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 300,
    height: 180,
    borderRadius: 20,
  },
  containerForm: {
    backgroundColor: '#ffffff', // Cor branca
    flex: 1,
    margin: 5,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingStart: '5%',
    paddingEnd: '5%',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    marginTop: 28,
    color: '#000000', // Cor preta
  },
  input: {
    borderBottomWidth: 1,
    height: 40,
    marginBottom: 10,
    fontSize: 16,
    borderBottomColor: '#000000', // Cor preta
  },
  button: {
    backgroundColor: '#000000', // Cor preta
    width: '100%',
    borderRadius: 6,
    paddingVertical: 8,
    marginTop: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 19,
    color: '#ffffff', // Cor branca
    fontWeight: 'bold',
  },
  buttonRegister: {
    marginTop: 3,
    alignSelf: 'center',
  },
  registerText: {
    color: '#000000', // Cor preta
    marginTop: 20,
    fontSize: 15,
  },
  togglePasswordButton: {
    paddingEnd: 10,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  buttonForgotPassword: {
    marginTop: 20,
    alignSelf: 'center',
  },
  forgotPasswordText: {
    color: '#000000', // Cor preta
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  googleButton: {
    backgroundColor: '#DB4437',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  googleButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

