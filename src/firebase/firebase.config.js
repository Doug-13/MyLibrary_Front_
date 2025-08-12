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