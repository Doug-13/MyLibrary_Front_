// // context/AuthContext.js
// import React, { createContext, useEffect, useMemo, useState } from 'react';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import auth from '@react-native-firebase/auth';
// import { API_BASE_URL } from '../src/config/api';

// // ✅ Opcional: centralizar baseURL e (se usar) token de sessão
// axios.defaults.baseURL = API_BASE_URL;

// export const AuthContext = createContext({});

// export function AuthProvider({ children }) {
//   const [signed, setSigned] = useState(false);
//   const [loading, setLoading] = useState(true);

//   // Perfil
//   const [userName, setUserName] = useState('');
//   const [userFirstName, setUserFirstName] = useState('');
//   const [aboutMe, setAboutMe] = useState('');
//   const [libraryVisibility, setLibraryVisibility] = useState('');
//   const [userId, setUserId] = useState('');           // Firebase UID
//   const [userMongoId, setUserMongoId] = useState(''); // _id do Mongo
//   const [userProfilePicture, setUserProfilePicture] = useState('');
//   const [timeStamp, setTimeStamp] = useState('');

//   const extractFirstName = (fullName) => (fullName ? fullName.split(' ')[0] : '');

//   const getProviderIds = (firebaseUser) =>
//     (firebaseUser?.providerData || [])
//       .map((p) => p?.providerId)
//       .filter(Boolean);

//   // -------- API helpers --------
//   async function createOrUpdateGoogleUser(firebaseUser) {
//     const uid = firebaseUser?.uid;
//     if (!uid) throw new Error('Firebase UID não disponível');

//     const displayName =
//       firebaseUser?.displayName ||
//       firebaseUser?.providerData?.[0]?.displayName ||
//       firebaseUser?.email?.split('@')?.[0] ||
//       'Usuário';

//     const email = firebaseUser?.email || '';
//     const foto = firebaseUser?.photoURL || '';

//     const payload = {
//       idFirebase: uid,
//       nome_completo: displayName,
//       email,
//       visibilidade_biblioteca: 'friends',
//       generos_favoritos: [],
//       foto_perfil: foto,
//       sobremim: '',
//       telefone: '',
//     };

//     console.log('[AuthContext] ▶️ POST /users/google-login payload:', payload);
//     const { data } = await axios.post('/users/google-login', payload);
//     console.log('[AuthContext] ✅ /users/google-login resposta:', data);
//     return data;
//   }

//   async function fetchUserByFirebaseId(uid) {
//     console.log('[AuthContext] ▶️ GET /users/firebase/:id =>', uid);
//     try {
//       const { data } = await axios.get(`/users/firebase/${uid}`);
//       console.log('[AuthContext] ✅ /users/firebase resposta:', data);
//       return data;
//     } catch (err) {
//       const status = err?.response?.status;
//       console.log('[AuthContext] ❌ /users/firebase erro:', status, err?.response?.data || err?.message);
//       if (status === 404) {
//         // Política definida: não criar usuário novo no login por e-mail/senha
//         throw new Error('Usuário não encontrado. Conclua o cadastro antes de fazer login.');
//       }
//       throw err;
//     }
//   }

//   // -------- Sessão / Logout --------
//   const clearState = async () => {
//     await AsyncStorage.multiRemove(['userToken']);
//     setSigned(false);
//     setUserId('');
//     setUserMongoId('');
//     setUserName('');
//     setUserFirstName('');
//     setLibraryVisibility('');
//     setUserProfilePicture('');
//     setAboutMe('');
//   };

//   const logout = async () => {
//     try {
//       await GoogleSignin.signOut().catch(() => {});
//       await auth().signOut();
//     } finally {
//       await clearState();
//     }
//   };

//   // -------- Observa mudanças de autenticação --------
//   useEffect(() => {
//     console.log('[AuthContext] 🔌 Iniciando onAuthStateChanged listener...');
//     const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
//       console.log('[AuthContext] 🔄 onAuthStateChanged:', firebaseUser?.uid || 'sem usuário');

//       try {
//         if (!firebaseUser) {
//           console.log('[AuthContext] 🚪 Usuário deslogado.');
//           await clearState();
//           setLoading(false);
//           return;
//         }

//         const uid = firebaseUser.uid;
//         await AsyncStorage.setItem('userToken', uid);

//         // Descobrir provedores do usuário
//         const providers = getProviderIds(firebaseUser);
//         const isGoogle = providers.includes('google.com');
//         const isPassword = providers.includes('password');

//         console.log('[AuthContext] 👤 Provedores detectados:', providers);

//         let u = null;

//         if (isGoogle) {
//           // ✅ Google: cria/atualiza no banco
//           u = await createOrUpdateGoogleUser(firebaseUser);
//         } else if (isPassword) {
//           // ✅ Email/senha: apenas busca; não cria/atualiza
//           u = await fetchUserByFirebaseId(uid);
//         } else {
//           // Outros provedores (Apple, GitHub, etc.) — ajuste a política se usar
//           console.log('[AuthContext] ⚠️ Provedor não mapeado. Tentando buscar por UID.');
//           u = await fetchUserByFirebaseId(uid);
//         }

//         console.log('[AuthContext] 🧩 Usuário final do banco:', u);

//         // Atualiza estado global
//         setUserId(uid);
//         setUserName(u?.nome_completo || '');
//         setUserFirstName(extractFirstName(u?.nome_completo || ''));
//         setLibraryVisibility(u?.visibilidade_biblioteca || '');
//         setUserMongoId(u?._id || '');
//         setUserProfilePicture(u?.foto_perfil || '');
//         setAboutMe(u?.sobremim || '');

//         console.log('[AuthContext] 📌 Estado atualizado:', {
//           userId: uid,
//           userMongoId: u?._id,
//           nome_completo: u?.nome_completo,
//           visibilidade_biblioteca: u?.visibilidade_biblioteca,
//           foto_perfil: u?.foto_perfil,
//           sobremim: u?.sobremim,
//         });

//         setSigned(true);
//       } catch (e) {
//         console.log('[AuthContext] ❌ Erro no onAuthStateChanged:', e?.message, e);
//         // Mantém coerência do "signed" com o estado atual do Firebase
//         setSigned(!!auth().currentUser);
//       } finally {
//         setLoading(false);
//       }
//     });

//     return unsubscribe;
//   }, []);

//   // -------- Ações de login --------
//   const signIn = async (email, password) => {
//     setLoading(true);
//     try {
//       console.log('[AuthContext] 🔐 signIn(email/senha) iniciando...');
//       await auth().signInWithEmailAndPassword(email, password);
//       console.log('[AuthContext] 🔐 signIn(email/senha) ok');
//     } catch (e) {
//       console.log('[AuthContext] ❌ signIn(email/senha) erro:', e?.message, e);
//       throw e;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const signInWithGoogle = async () => {
//     setLoading(true);
//     try {
//       console.log('[AuthContext] 🔐 signInWithGoogle iniciando...');
//       await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
//       const { idToken } = await GoogleSignin.signIn();
//       const googleCredential = auth.GoogleAuthProvider.credential(idToken);
//       await auth().signInWithCredential(googleCredential);
//       console.log('[AuthContext] 🔐 signInWithGoogle ok');
//     } catch (e) {
//       console.log('[AuthContext] ❌ signInWithGoogle erro:', e?.message, e);
//       throw e;
//     } finally {
//       setLoading(false);
//     }
//   };

//   // -------- Atualizações locais de perfil --------
//   const updateUser = (updatedData) => {
//     if (updatedData.nome_completo !== undefined) {
//       setUserName(updatedData.nome_completo);
//       setUserFirstName(extractFirstName(updatedData.nome_completo));
//     }
//     if (updatedData.visibilidade_biblioteca !== undefined)
//       setLibraryVisibility(updatedData.visibilidade_biblioteca);
//     if (updatedData.foto_perfil !== undefined)
//       setUserProfilePicture(updatedData.foto_perfil);
//     if (updatedData.sobremim !== undefined)
//       setAboutMe(updatedData.sobremim);
//   };

//   const value = useMemo(
//     () => ({
//       // estados
//       signed,
//       loading,
//       sobremim: aboutMe,
//       nome_completo: userName,
//       primeiro_nome: userFirstName,
//       visibilidade_biblioteca: libraryVisibility,
//       userId,
//       userMongoId,
//       userProfilePicture,
//       timeStamp,

//       // ações
//       signIn,
//       signInWithGoogle,
//       logout,
//       setTimeStamp,
//       updateUser,
//     }),
//     [
//       signed,
//       loading,
//       aboutMe,
//       userName,
//       userFirstName,
//       libraryVisibility,
//       userId,
//       userMongoId,
//       userProfilePicture,
//       timeStamp,
//     ]
//   );

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }


// context/AuthContext.js
import React, { createContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { API_BASE_URL } from '../src/config/api';

// Centraliza baseURL
axios.defaults.baseURL = API_BASE_URL;

export const AuthContext = createContext({});

/**
 * Normaliza o documento vindo do banco para um shape consistente no app.
 */
function normalizeUserFromDB(db = {}) {
  const notifications = db.notifications || {};
  return {
    _id: db._id || '',
    idFirebase: db.idFirebase || '',
    nome_completo: db.nome_completo || '',
    username: db.username || '',
    email: db.email || '',
    telefone: db.telefone || '',
    foto_perfil: db.foto_perfil || '',
    endereco: db.endereco || '',
    data_nascimento: db.data_nascimento || '',
    visibilidade_biblioteca: db.visibilidade_biblioteca || 'friends',
    generos_favoritos: Array.isArray(db.generos_favoritos) ? db.generos_favoritos : [],
    cod_usuario: db.cod_usuario || '',
    data_cadastro: db.data_cadastro || '',
    // Preferências
    theme: db.theme || 'system', // 'light' | 'dark' | 'system'
    language: db.language || 'pt-BR',
    notifications: {
      push: notifications.push ?? true,
      email: notifications.email ?? false,
      loanRequests: notifications.loanRequests ?? true,
      returns: notifications.returns ?? true,
      friends: notifications.friends ?? true,
    },
    // Campos legados/auxiliares
    sobremim: db.sobremim || '',
  };
}

export function AuthProvider({ children }) {
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);

  // ======== ESTADO =========
  // Identidades
  const [userId, setUserId] = useState(''); // Firebase UID
  const [userMongoId, setUserMongoId] = useState(''); // _id Mongo

  // Perfil básico
  const [nome_completo, setNomeCompleto] = useState('');
  const [primeiro_nome, setPrimeiroNome] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [foto_perfil, setFotoPerfil] = useState('');
  const [endereco, setEndereco] = useState('');
  const [data_nascimento, setDataNascimento] = useState('');
  const [sobremim, setSobreMim] = useState('');
  const [generos_favoritos, setGenerosFavoritos] = useState([]);
  const [cod_usuario, setCodUsuario] = useState('');
  const [data_cadastro, setDataCadastro] = useState('');

  // Preferências
  const [visibilidade_biblioteca, setVisibilidadeBiblioteca] = useState('friends');
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState('pt-BR');
  const [notifications, setNotifications] = useState({
    push: true,
    email: false,
    loanRequests: true,
    returns: true,
    friends: true,
  });

  const [timeStamp, setTimeStamp] = useState(''); // livre para auditoria/forçar re-renders

  const extractFirstName = (fullName) => (fullName ? fullName.split(' ')[0] : '');
  const getProviderIds = (firebaseUser) => (firebaseUser?.providerData || []).map(p => p?.providerId).filter(Boolean);

  // ======== HELPERS DE API =========
  const createOrUpdateGoogleUser = useCallback(async (firebaseUser) => {
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
      theme: 'system',
      language: 'pt-BR',
      notifications: { push: true, email: false, loanRequests: true, returns: true, friends: true },
    };

    const { data } = await axios.post('/users/google-login', payload);
    return normalizeUserFromDB(data);
  }, []);

  const fetchUserByFirebaseId = useCallback(async (uid) => {
    const { data } = await axios.get(`/users/firebase/${uid}`);
    return normalizeUserFromDB(data);
  }, []);

  const patchUser = useCallback(async (mongoId, payload) => {
    if (!mongoId) throw new Error('ID do usuário (Mongo) ausente.');
    const { data } = await axios.patch(`/users/${mongoId}`, payload);
    return normalizeUserFromDB(data);
  }, []);

  // Persistência leve local das preferências para uma primeira renderização rápida
  const persistLocalPrefs = useCallback(async (prefs) => {
    try {
      const ops = [];
      if (prefs.theme !== undefined) ops.push(['settings.theme', String(prefs.theme)]);
      if (prefs.language !== undefined) ops.push(['settings.language', String(prefs.language)]);
      if (prefs.visibilidade_biblioteca !== undefined) ops.push(['settings.libraryVisibility', String(prefs.visibilidade_biblioteca)]);
      if (prefs.notifications !== undefined) ops.push(['settings.notifications', JSON.stringify(prefs.notifications)]);
      if (!ops.length) return;
      await AsyncStorage.multiSet(ops);
    } catch (_) {
      // silencioso
    }
  }, []);

  // Injeta usuário normalizado no estado global
  const applyUserToState = useCallback((u) => {
    setUserMongoId(u._id);
    setNomeCompleto(u.nome_completo);
    setPrimeiroNome(extractFirstName(u.nome_completo));
    setUsername(u.username);
    setEmail(u.email);
    setTelefone(u.telefone);
    setFotoPerfil(u.foto_perfil);
    setEndereco(u.endereco);
    setDataNascimento(u.data_nascimento);
    setVisibilidadeBiblioteca(u.visibilidade_biblioteca);
    setGenerosFavoritos(u.generos_favoritos);
    setCodUsuario(u.cod_usuario);
    setDataCadastro(u.data_cadastro);
    setTheme(u.theme);
    setLanguage(u.language);
    setNotifications(u.notifications);
    setSobreMim(u.sobremim);
  }, []);

  // ======== SESSÃO/LOGOUT =========
  const clearState = useCallback(async () => {
    await AsyncStorage.multiRemove(['userToken']);
    setSigned(false);

    setUserId('');
    setUserMongoId('');

    setNomeCompleto('');
    setPrimeiroNome('');
    setUsername('');
    setEmail('');
    setTelefone('');
    setFotoPerfil('');
    setEndereco('');
    setDataNascimento('');
    setSobreMim('');
    setGenerosFavoritos([]);
    setCodUsuario('');
    setDataCadastro('');

    setVisibilidadeBiblioteca('friends');
    setTheme('system');
    setLanguage('pt-BR');
    setNotifications({ push: true, email: false, loanRequests: true, returns: true, friends: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await GoogleSignin.signOut().catch(() => {});
      await auth().signOut();
    } finally {
      await clearState();
    }
  }, [clearState]);

  // ======== AUTH LISTENER =========
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          await clearState();
          setLoading(false);
          return;
        }

        const uid = firebaseUser.uid;
        setUserId(uid);
        await AsyncStorage.setItem('userToken', uid);

        const providers = getProviderIds(firebaseUser);
        const isGoogle = providers.includes('google.com');
        const isPassword = providers.includes('password');

        let u = null;
        if (isGoogle) {
          u = await createOrUpdateGoogleUser(firebaseUser);
        } else if (isPassword) {
          u = await fetchUserByFirebaseId(uid);
        } else {
          // fallback
          u = await fetchUserByFirebaseId(uid);
        }

        applyUserToState(u);
        await persistLocalPrefs({
          theme: u.theme,
          language: u.language,
          visibilidade_biblioteca: u.visibilidade_biblioteca,
          notifications: u.notifications,
        });

        setSigned(true);
      } catch (e) {
        console.log('[AuthContext] onAuthStateChanged erro:', e?.message);
        setSigned(!!auth().currentUser);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [applyUserToState, clearState, createOrUpdateGoogleUser, fetchUserByFirebaseId, persistLocalPrefs]);

  // ======== AÇÕES DE LOGIN =========
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const { idToken } = await GoogleSignin.signIn();
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      await auth().signInWithCredential(googleCredential);
    } finally {
      setLoading(false);
    }
  }, []);

  // ======== ATUALIZAÇÕES NO BANCO =========
  /** Atualiza preferências (theme, language, visibilidade, notifications) no banco e no estado. */
  const updateSettings = useCallback(async (partial) => {
    const payload = {};
    if (partial.theme !== undefined) payload.theme = partial.theme;
    if (partial.language !== undefined) payload.language = partial.language;
    if (partial.visibilidade_biblioteca !== undefined) payload.visibilidade_biblioteca = partial.visibilidade_biblioteca;
    if (partial.notifications !== undefined) payload.notifications = partial.notifications;

    const updated = await patchUser(userMongoId, payload);
    applyUserToState(updated);
    await persistLocalPrefs(payload);
    setTimeStamp(String(Date.now()));
    return updated;
  }, [applyUserToState, patchUser, persistLocalPrefs, userMongoId]);

  /** Atualiza perfil do usuário (sem senha) no banco e no estado. */
  const updateProfile = useCallback(async (partial) => {
    const allowed = [
      'nome_completo', 'username', 'telefone', 'foto_perfil', 'endereco', 'data_nascimento', 'sobremim', 'generos_favoritos'
    ];
    const payload = {};
    allowed.forEach((k) => {
      if (partial[k] !== undefined) payload[k] = partial[k];
    });

    const updated = await patchUser(userMongoId, payload);
    applyUserToState(updated);
    setTimeStamp(String(Date.now()));
    return updated;
  }, [applyUserToState, patchUser, userMongoId]);

  /** Atalho para alternar um flag de notifications no estado e no banco. */
  const toggleNotification = useCallback(async (key) => {
    const next = { ...notifications, [key]: !notifications[key] };
    return updateSettings({ notifications: next });
  }, [notifications, updateSettings]);

  /** Recarrega do servidor e aplica no estado. */
  const refreshUser = useCallback(async () => {
    if (!userId) return null;
    const u = await fetchUserByFirebaseId(userId);
    applyUserToState(u);
    setSigned(true);
    return u;
  }, [applyUserToState, fetchUserByFirebaseId, userId]);

  // ======== CONTEXTO =========
  const value = useMemo(() => ({
    // flags
    signed,
    loading,

    // ids
    userId,
    userMongoId,

    // perfil
    nome_completo,
    primeiro_nome,
    username,
    email,
    telefone,
    foto_perfil,
    endereco,
    data_nascimento,
    sobremim,
    generos_favoritos,
    cod_usuario,
    data_cadastro,

    // preferências
    visibilidade_biblioteca,
    theme,
    language,
    notifications,

    // util
    timeStamp,

    // ações
    signIn,
    signInWithGoogle,
    logout,
    updateSettings,
    updateProfile,
    toggleNotification,
    refreshUser,
    setTimeStamp,
  }), [
    signed, loading,
    userId, userMongoId,
    nome_completo, primeiro_nome, username, email, telefone, foto_perfil, endereco, data_nascimento, sobremim, generos_favoritos, cod_usuario, data_cadastro,
    visibilidade_biblioteca, theme, language, notifications,
    timeStamp,
    signIn, signInWithGoogle, logout, updateSettings, updateProfile, toggleNotification, refreshUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
