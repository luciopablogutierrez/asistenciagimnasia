// Importar y configurar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Configuración de Firebase utilizando variables de entorno
const firebaseConfig = {
  // Clave API de Firebase
  apiKey: process.env.FIREBASE_API_KEY,

  // Dominio de autenticación
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,

  // ID del proyecto
  projectId: process.env.FIREBASE_PROJECT_ID,

  // Bucket de almacenamiento
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,

  // ID del remitente de mensajes
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,

  // ID de la app
  appId: process.env.FIREBASE_APP_ID,

  // ID de medición (Google Analytics)
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exportar app y db
export { app as firebaseApp, db };
