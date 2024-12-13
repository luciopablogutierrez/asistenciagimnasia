import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js";

// Definir correos permitidos
const allowedEmails = ["lucio.gutierrez@gmail.com", "gimnasiaartisticaelbolson@gmail.com"];

// Inicializar autenticación
const auth = getAuth();

export function checkAuthentication() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, user => {
      if (user && allowedEmails.includes(user.email)) {
        console.log("Acceso permitido para:", user.email);
        resolve(user); // Usuario permitido
      } else {
        reject("Acceso denegado"); // Usuario no permitido
      }
    });
  });
}
