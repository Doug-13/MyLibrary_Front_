import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebase/firebase.config';
import axios from 'axios';

import { API_BASE_URL } from '../src/config/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userFirstName, setUserFirstName] = useState(''); // Novo estado para o primeiro nome
  const [aboutMe, setAboutMe] = useState('');
  const [libraryVisibility, setLibraryVisibility] = useState('');
  const [userId, setUserId] = useState('');
  const [userMongoId, setUserMongoId] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [timeStamp, setTimeStamp] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Definido corretamente

  // Função para extrair o primeiro nome
  const extractFirstName = (fullName) => {
    if (!fullName) return '';
    return fullName.split(' ')[0];
  };

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          
          const response = await axios.get(`${API_BASE_URL}/users/${userToken}`);
          const userData = response.data;

          setUserId(userToken);
          setUserName(userData.nome_completo);
          setUserFirstName(extractFirstName(userData.nome_completo)); // Define o primeiro nome
          setLibraryVisibility(userData.visibilidade_biblioteca);
          setUserMongoId(userData._id);
          setUserProfilePicture(userData.foto_perfil);
          setAboutMe(userData.sobremim);
          setSigned(true);
        }
      } catch (error) {
        console.error('Error checking logged-in user:', error.message);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedInUser();
  }, []);

  const signIn = async (email, password, navigate) => {
    setLoading(true);
    setErrorMessage(''); // Limpa mensagens de erro anteriores
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log("Trancando aqui")
      console.log(`${API_BASE_URL}/users/${firebaseUser.uid}`)
      const response = await axios.get(`${API_BASE_URL}/users/${firebaseUser.uid}`);
      console.log("Trancando aqui")
      const userData = response.data;
  
      await AsyncStorage.setItem('userToken', firebaseUser.uid);
  
      setUserId(firebaseUser.uid);
      setUserName(userData.nome_completo);
      setUserFirstName(extractFirstName(userData.nome_completo));
      setLibraryVisibility(userData.visibilidade_biblioteca);
      setUserMongoId(userData._id);
      setUserProfilePicture(userData.foto_perfil);
      setAboutMe(userData.sobremim);
  
      setSigned(true);
      navigate('MainScreen');
    } catch (error) {
      console.log('Erro técnico durante login:', error); // Log técnico para depuração
      switch (error.code) {
        case 'auth/user-not-found':
          setErrorMessage('E-mail não cadastrado. Por favor, registre-se.');
          break;
        case 'auth/wrong-password':
          setErrorMessage('Senha incorreta. Verifique e tente novamente.');
          break;
        case 'auth/invalid-email':
          setErrorMessage('E-mail inválido. Por favor, insira um e-mail válido.');
          break;
        case 'auth/invalid-credential':
          setErrorMessage('Usuário não cadastrado. Favor realizar seu cadastro.');
          break;
        default:
          setErrorMessage('Ocorreu um erro ao realizar login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');

      setUserId('');
      setUserName('');
      setUserFirstName(''); // Limpa o primeiro nome
      setLibraryVisibility('');
      setUserMongoId('');
      setUserProfilePicture('');
      setAboutMe('');

      setSigned(false);
    } catch (error) {
      console.error('Error during logout:', error.message);
    }
  };

  // Função para atualizar os dados do usuário no contexto
  const updateUser = (updatedData) => {
    if (updatedData.nome_completo !== undefined) {
      setUserName(updatedData.nome_completo);
      setUserFirstName(extractFirstName(updatedData.nome_completo)); // Atualiza o primeiro nome
    }
    if (updatedData.visibilidade_biblioteca !== undefined) setLibraryVisibility(updatedData.visibilidade_biblioteca);
    if (updatedData.foto_perfil !== undefined) setUserProfilePicture(updatedData.foto_perfil);
    if (updatedData.sobremim !== undefined) setAboutMe(updatedData.sobremim);
  };

  

  return (
    <AuthContext.Provider value={{
      signed,
      loading,
      signIn,
      logout,
      sobremim: aboutMe,
      nome_completo: userName,
      primeiro_nome: userFirstName, // Expondo o primeiro nome
      visibilidade_biblioteca: libraryVisibility,
      userId,
      userMongoId,
      userProfilePicture,
      setTimeStamp,
      timeStamp,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
