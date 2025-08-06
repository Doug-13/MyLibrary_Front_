import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/firebase.config';
import axios from 'axios';

import { API_BASE_URL } from '../src/config/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [libraryVisibility, setLibraryVisibility] = useState('');
  const [userId, setUserId] = useState('');
  const [userMongoId, setUserMongoId] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        if (userToken) {
          const response = await axios.get(`${API_BASE_URL}/users/${userToken}`);
          const userData = response.data;

          setUserId(userToken);
          setUserName(userData.nome_completo);
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
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log(firebaseUser)

      console.log(`${API_BASE_URL}/users/${firebaseUser.uid}`)
      const response = await axios.get(`${API_BASE_URL}/users/${firebaseUser.uid}`);
      const userData = response.data;

      await AsyncStorage.setItem('userToken', firebaseUser.uid);

      setUserId(firebaseUser.uid);
      setUserName(userData.nome_completo);
      setLibraryVisibility(userData.visibilidade_biblioteca);
      setUserMongoId(userData._id);
      setUserProfilePicture(userData.foto_perfil);
      setAboutMe(userData.sobremim);

      setSigned(true);
      navigate('MainScreen');
    } catch (error) {
      console.error('Error during sign-in:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');

      setUserId('');
      setUserName('');
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
    if (updatedData.nome_completo !== undefined) setUserName(updatedData.nome_completo);
    if (updatedData.visibilidade_biblioteca !== undefined) setLibraryVisibility(updatedData.visibilidade_biblioteca);
    if (updatedData.foto_perfil !== undefined) setUserProfilePicture(updatedData.foto_perfil);
    if (updatedData.sobremim !== undefined) setAboutMe(updatedData.sobremim);
    // Atualize outros estados conforme necessário
  };

  return (
    <AuthContext.Provider value={{
      signed,
      loading,
      signIn,
      logout,
      sobremim: aboutMe,
      nome_completo: userName,
      visibilidade_biblioteca: libraryVisibility,
      userId,
      userMongoId,
      userProfilePicture,
      updateUser, // Expondo a função para atualizar os dados
    }}>
      {children}
    </AuthContext.Provider>
  );
}