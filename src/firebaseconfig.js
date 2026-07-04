import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuração do Firebase com as credenciais do usuário
const firebaseConfig = {
  apiKey: "AIzaSyBGvJjVuESi4CXL2UNi3xuxemOQI9JzT9g",
  authDomain: "hiperfit-664af.firebaseapp.com",
  projectId: "hiperfit-664af",
  storageBucket: "hiperfit-664af.firebasestorage.app",
  messagingSenderId: "65570477164",
  appId: "1:65570477164:web:1aa4165fb2c4f9bc01f449",
  measurementId: "G-DHXRS197CK"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firebase Auth e exporta para uso nos componentes
export const auth = getAuth(app);

// Inicializa o Provedor do Google
export const googleProvider = new GoogleAuthProvider();

// Inicializa o Firestore e exporta
export const db = getFirestore(app);


