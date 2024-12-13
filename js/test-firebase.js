import { checkAuthentication } from "./auth.js";

checkAuthentication()
  .then(user => {
    console.log(`Bienvenido, ${user.email}`);
    document.querySelector("main").style.display = "block"; // Mostrar contenido
  })
  .catch(error => {
    alert(error);
    window.location.href = "login.html"; // Redirigir si no está autorizado
  });
  
import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Probar conexión a Firestore
async function testFirestore() {
  try {
    const testCollectionRef = collection(db, "Alumnos"); // Cambia "Alumnos" por una colección existente
    const snapshot = await getDocs(testCollectionRef);

    console.log("Conexión exitosa con Firebase Firestore.");
    console.log("Documentos obtenidos:");
    snapshot.docs.forEach(doc => {
      console.log(`ID: ${doc.id}, Data:`, doc.data());
    });

    alert("¡Conexión exitosa con Firebase!");
  } catch (error) {
    console.error("Error conectando a Firebase Firestore:", error);
    alert("Error conectando a Firebase. Verifica tu configuración.");
  }
}

testFirestore();
