// Arquivo: firebase/firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, getDocs, 
    deleteDoc, doc, updateDoc, query, where, onSnapshot, getDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Sua configuração original (mantive seus dados)
const firebaseConfig = {
  apiKey: "AIzaSyCMt3ExOt5ZvyxI41pPBrOU027DLDGyzzY",
  authDomain: "natal-9df86.firebaseapp.com",
  projectId: "natal-9df86",
  storageBucket: "natal-9df86.firebasestorage.app",
  messagingSenderId: "15158518090",
  appId: "1:15158518090:web:3cf877ae6f699f3defa1b3",
  measurementId: "G-N1S36JE1RG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportamos tudo o que o site vai usar
export { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, onSnapshot, getDoc };