import React, { createContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth, {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from '@react-native-firebase/auth';
import { API_BASE_URL } from '../src/config/api';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const authInstance = getAuth();
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [libraryVisibility, setLibraryVisibility] = useState('');
  const [userId, setUserId] = useState('');
  const [userMongoId, setUserMongoId] = useState('');
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [timeStamp, setTimeStamp] = useState('');

  const extractFirstName = (fullName) => (fullName ? fullName.split(' ')[0] : '');

  async function fetchOrCreateUserByFirebase(firebaseUser) {
    const uid = firebaseUser?.uid;
    if (!uid) throw new Error('Firebase UID não disponível');

    const displayName =
      firebaseUser?.displayName ||
      firebaseUser?.providerData?.[0]?.displayName ||
      firebaseUser?.email?.split('@')?.[0] ||
      'Usuário';

    const email = firebaseUser?.email || '';
    const foto = firebaseUser?.photoURL || '';

    const payload = {
      idFirebase: uid,
      nome_completo: displayName,
      email,
      visibilidade_biblioteca: 'friends',
      generos_favoritos: [],
      foto_perfil: foto,
      sobremim: '',
      telefone: '',
    };

    const { data } = await axios.post(`${API_BASE_URL}/users/google-login`, payload);
    return data;
  }

  const clearState = async () => {
    await AsyncStorage.multiRemove(['userToken']);
    setSigned(false);
    setUserId('');
    setUserMongoId('');
    setUserName('');
    setUserFirstName('');
    setLibraryVisibility('');
    setUserProfilePicture('');
    setAboutMe('');
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut().catch(() => { });
      // Opcional: await GoogleSignin.revokeAccess().catch(() => {});
      await firebaseSignOut(auth());
    } finally {
      await clearState();
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(authInstance, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          await clearState();
          return;
        }

        const uid = firebaseUser.uid;
        await AsyncStorage.setItem('userToken', uid);

        const u = await fetchOrCreateUserByFirebase(firebaseUser);

        setUserId(uid);
        setUserName(u?.nome_completo || '');
        setUserFirstName(extractFirstName(u?.nome_completo || ''));
        setLibraryVisibility(u?.visibilidade_biblioteca || '');
        setUserMongoId(u?._id || '');
        setUserProfilePicture(u?.foto_perfil || '');
        setAboutMe(u?.sobremim || '');

        setSigned(true);
      } catch (e) {
        console.log('AuthContext onAuthStateChanged error:', e?.message);
        setSigned(!!authInstance.currentUser);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, [authInstance]);

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(authInstance, email, password);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (updatedData) => {
    if (updatedData.nome_completo !== undefined) {
      setUserName(updatedData.nome_completo);
      setUserFirstName(extractFirstName(updatedData.nome_completo));
    }
    if (updatedData.visibilidade_biblioteca !== undefined)
      setLibraryVisibility(updatedData.visibilidade_biblioteca);
    if (updatedData.foto_perfil !== undefined)
      setUserProfilePicture(updatedData.foto_perfil);
    if (updatedData.sobremim !== undefined)
      setAboutMe(updatedData.sobremim);
  };

  const value = useMemo(
    () => ({
      signed,
      loading,
      signIn,
      logout,
      sobremim: aboutMe,
      nome_completo: userName,
      primeiro_nome: userFirstName,
      visibilidade_biblioteca: libraryVisibility,
      userId,
      userMongoId,
      userProfilePicture,
      setTimeStamp,
      timeStamp,
      updateUser,
    }),
    [
      signed,
      loading,
      aboutMe,
      userName,
      userFirstName,
      libraryVisibility,
      userId,
      userMongoId,
      userProfilePicture,
      timeStamp,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
