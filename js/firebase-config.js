// Importar y configurar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "asistencia-d91af.firebaseapp.com",
  projectId: "asistencia-d91af",
  storageBucket: "asistencia-d91af.firebasestorage.app",
  messagingSenderId: "730285026746",
  appId: "1:730285026746:web:599bb94f8b4045198f8183",
  measurementId: "G-HSEY348Z8F"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportar app y db
export { app as firebaseApp, db };
