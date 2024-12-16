// Importar y configurar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Configuración de Firebase (estos valores se reemplazarán en el build de GitHub Actions)
const firebaseConfig = {
  apiKey: "${{ secrets.FIREBASE_API_KEY }}",
  authDomain: "${{ secrets.FIREBASE_AUTH_DOMAIN }}",
  projectId: "${{ secrets.FIREBASE_PROJECT_ID }}",
  storageBucket: "${{ secrets.FIREBASE_STORAGE_BUCKET }}",
  messagingSenderId: "${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}",
  appId: "${{ secrets.FIREBASE_APP_ID }}",
  measurementId: "${{ secrets.FIREBASE_MEASUREMENT_ID }}",
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportar app y db
export { app as firebaseApp, db };
