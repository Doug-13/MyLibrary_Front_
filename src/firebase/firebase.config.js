  // import { initializeApp } from "firebase/app";
  // import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
  // import { getStorage } from 'firebase/storage';  // Importa o Firebase Storage
  // import AsyncStorage from '@react-native-async-storage/async-storage';

  // // Sua configuração Firebase
  // const firebaseConfig = {
  //     apiKey: "AIzaSyC1Al-QDuDch3h1vxhdWBCnMEXm-OdOuhE",
  //     authDomain: "mylibrary-90151.firebaseapp.com",
  //     projectId: "mylibrary-90151",
  //     storageBucket: "mylibrary-90151.appspot.com",
  //     messagingSenderId: "920349589094",
  //     appId: "1:920349589094:web:0b7ebe602a28a2affa77a7"
  //   };

  // // Inicializa o Firebase
  // const app = initializeApp(firebaseConfig);

  // // Inicializa o Auth com persistência em AsyncStorage
  // export const auth = initializeAuth(app, {
  //   persistence: getReactNativePersistence(AsyncStorage)
  // });

  // // Inicializa o Firebase Storage
  // export const storage = getStorage(app);  // Exporta o Firebase Storage
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyC1Al-QDuDch3h1vxhdWBCnMEXm-OdOuhE",
  authDomain: "mylibrary-90151.firebaseapp.com",
  projectId: "mylibrary-90151",
  storageBucket: "mylibrary-90151.appspot.com",
  messagingSenderId: "920349589094",
  appId: "1:920349589094:web:0b7ebe602a28a2affa77a7"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Auth
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  console.error('Error initializing auth:', error);
  auth = getAuth(app);
}

// Inicializa o Storage
const storage = getStorage(app);

export { auth, storage };




// import { GoogleSignin } from '@react-native-google-signin/google-signin';
// import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

// // Configure o client ID do Firebase (tipo Web)
// GoogleSignin.configure({
//   webClientId: 'SEU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com',
// });

// const signInWithGoogle = async (navigate) => {
//   try {
//     setLoading(true);
//     const { idToken } = await GoogleSignin.signIn();
//     const googleCredential = GoogleAuthProvider.credential(idToken);
//     const userCredential = await signInWithCredential(auth, googleCredential);
//     const firebaseUser = userCredential.user;

//     const response = await axios.get(`${API_BASE_URL}/users/${firebaseUser.uid}`);
//     const userData = response.data;

//     await AsyncStorage.setItem('userToken', firebaseUser.uid);
//     setUserId(firebaseUser.uid);
//     setUserName(userData.nome_completo);
//     setUserFirstName(extractFirstName(userData.nome_completo));
//     setLibraryVisibility(userData.visibilidade_biblioteca);
//     setUserMongoId(userData._id);
//     setUserProfilePicture(userData.foto_perfil);
//     setAboutMe(userData.sobremim);

//     setSigned(true);
//     navigate('MainScreen');
//   } catch (error) {
//     console.error('Erro no login com Google:', error);
//     setErrorMessage('Erro ao autenticar com o Google. Tente novamente.');
//   } finally {
//     setLoading(false);
//   }
// };
