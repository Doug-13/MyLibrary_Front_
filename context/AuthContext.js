// context/AuthContext.js
import React, { createContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { API_BASE_URL } from '../src/config/api';

// ✅ Opcional: centralizar baseURL e (se usar) token de sessão
axios.defaults.baseURL = API_BASE_URL;

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);

  // Perfil
  const [userName, setUserName] = useState('');
  const [userFirstName, setUserFirstName] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [libraryVisibility, setLibraryVisibility] = useState('');
  const [userId, setUserId] = useState('');           // Firebase UID
  const [userMongoId, setUserMongoId] = useState(''); // _id do Mongo
  const [userProfilePicture, setUserProfilePicture] = useState('');
  const [timeStamp, setTimeStamp] = useState('');

  const extractFirstName = (fullName) => (fullName ? fullName.split(' ')[0] : '');

  const getProviderIds = (firebaseUser) =>
    (firebaseUser?.providerData || [])
      .map((p) => p?.providerId)
      .filter(Boolean);

  // -------- API helpers --------
  async function createOrUpdateGoogleUser(firebaseUser) {
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

    console.log('[AuthContext] ▶️ POST /users/google-login payload:', payload);
    const { data } = await axios.post('/users/google-login', payload);
    console.log('[AuthContext] ✅ /users/google-login resposta:', data);
    return data;
  }

  async function fetchUserByFirebaseId(uid) {
    console.log('[AuthContext] ▶️ GET /users/firebase/:id =>', uid);
    try {
      const { data } = await axios.get(`/users/firebase/${uid}`);
      console.log('[AuthContext] ✅ /users/firebase resposta:', data);
      return data;
    } catch (err) {
      const status = err?.response?.status;
      console.log('[AuthContext] ❌ /users/firebase erro:', status, err?.response?.data || err?.message);
      if (status === 404) {
        // Política definida: não criar usuário novo no login por e-mail/senha
        throw new Error('Usuário não encontrado. Conclua o cadastro antes de fazer login.');
      }
      throw err;
    }
  }

  // -------- Sessão / Logout --------
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
      await GoogleSignin.signOut().catch(() => {});
      await auth().signOut();
    } finally {
      await clearState();
    }
  };

  // -------- Observa mudanças de autenticação --------
  useEffect(() => {
    console.log('[AuthContext] 🔌 Iniciando onAuthStateChanged listener...');
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      console.log('[AuthContext] 🔄 onAuthStateChanged:', firebaseUser?.uid || 'sem usuário');

      try {
        if (!firebaseUser) {
          console.log('[AuthContext] 🚪 Usuário deslogado.');
          await clearState();
          setLoading(false);
          return;
        }

        const uid = firebaseUser.uid;
        await AsyncStorage.setItem('userToken', uid);

        // Descobrir provedores do usuário
        const providers = getProviderIds(firebaseUser);
        const isGoogle = providers.includes('google.com');
        const isPassword = providers.includes('password');

        console.log('[AuthContext] 👤 Provedores detectados:', providers);

        let u = null;

        if (isGoogle) {
          // ✅ Google: cria/atualiza no banco
          u = await createOrUpdateGoogleUser(firebaseUser);
        } else if (isPassword) {
          // ✅ Email/senha: apenas busca; não cria/atualiza
          u = await fetchUserByFirebaseId(uid);
        } else {
          // Outros provedores (Apple, GitHub, etc.) — ajuste a política se usar
          console.log('[AuthContext] ⚠️ Provedor não mapeado. Tentando buscar por UID.');
          u = await fetchUserByFirebaseId(uid);
        }

        console.log('[AuthContext] 🧩 Usuário final do banco:', u);

        // Atualiza estado global
        setUserId(uid);
        setUserName(u?.nome_completo || '');
        setUserFirstName(extractFirstName(u?.nome_completo || ''));
        setLibraryVisibility(u?.visibilidade_biblioteca || '');
        setUserMongoId(u?._id || '');
        setUserProfilePicture(u?.foto_perfil || '');
        setAboutMe(u?.sobremim || '');

        console.log('[AuthContext] 📌 Estado atualizado:', {
          userId: uid,
          userMongoId: u?._id,
          nome_completo: u?.nome_completo,
          visibilidade_biblioteca: u?.visibilidade_biblioteca,
          foto_perfil: u?.foto_perfil,
          sobremim: u?.sobremim,
        });

        setSigned(true);
      } catch (e) {
        console.log('[AuthContext] ❌ Erro no onAuthStateChanged:', e?.message, e);
        // Mantém coerência do "signed" com o estado atual do Firebase
        setSigned(!!auth().currentUser);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // -------- Ações de login --------
  const signIn = async (email, password) => {
    setLoading(true);
    try {
      console.log('[AuthContext] 🔐 signIn(email/senha) iniciando...');
      await auth().signInWithEmailAndPassword(email, password);
      console.log('[AuthContext] 🔐 signIn(email/senha) ok');
    } catch (e) {
      console.log('[AuthContext] ❌ signIn(email/senha) erro:', e?.message, e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      console.log('[AuthContext] 🔐 signInWithGoogle iniciando...');
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
      console.log('[AuthContext] 🔐 signInWithGoogle ok');
    } catch (e) {
      console.log('[AuthContext] ❌ signInWithGoogle erro:', e?.message, e);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  // -------- Atualizações locais de perfil --------
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
      // estados
      signed,
      loading,
      sobremim: aboutMe,
      nome_completo: userName,
      primeiro_nome: userFirstName,
      visibilidade_biblioteca: libraryVisibility,
      userId,
      userMongoId,
      userProfilePicture,
      timeStamp,

      // ações
      signIn,
      signInWithGoogle,
      logout,
      setTimeStamp,
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
