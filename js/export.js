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
import { collection, getDocs, doc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Referencias a las colecciones
const alumnosRef = collection(db, "Alumnos");
const turnosRef = collection(db, "Turnos");

// Objeto para mapear IDs a nombres
let allTurnos = {};

// Función para cargar turnos y mapear ID -> Nombre
async function loadTurnos() {
  try {
    const snapshot = await getDocs(turnosRef);
    snapshot.docs.forEach(doc => {
      const turno = doc.data();
      allTurnos[doc.id] = turno.Turno; // Mapeo ID -> Nombre
    });
  } catch (error) {
    console.error("Error cargando turnos:", error);
    alert("Hubo un error al cargar los turnos.");
  }
}

// Función para convertir datos en formato CSV
function convertToCSV(data, headers) {
  const csvRows = [];
  csvRows.push(headers.join(",")); // Agregar encabezados

  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      return typeof value === "string" ? `"${value}"` : value || "";
    });
    csvRows.push(row.join(","));
  });

  return csvRows.join("\n");
}

// Función para descargar archivo CSV
function downloadCSV(data, filename) {
  const blob = new Blob([data], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// Función para exportar alumnos
async function exportAlumnos() {
  try {
    await loadTurnos(); // Asegurar que los turnos estén cargados
    const snapshot = await getDocs(alumnosRef);

    const alumnos = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        Nombre: data.Nombre,
        Apellido: data.Apellido,
        "Fecha Nac": data.Fecha_nac ? new Date(data.Fecha_nac.seconds * 1000).toLocaleDateString() : "Sin fecha",
        Tel: data.Tel || "Sin teléfono",
        FM: data.FM ? "Sí" : "No",
        DNI: data.DNI,
        Turno: allTurnos[data.Turnos] || "Turno no encontrado", // Reemplazar ID por Nombre
      };
    });

    const headers = ["Nombre", "Apellido", "Fecha Nac", "Tel", "FM", "DNI", "Turno"];
    const csvData = convertToCSV(alumnos, headers);
    downloadCSV(csvData, "alumnos.csv");
  } catch (error) {
    console.error("Error exportando alumnos:", error);
    alert("Hubo un error al exportar los alumnos.");
  }
}

// Asociar eventos a los botones de exportación
document.getElementById("export-alumnos").addEventListener("click", exportAlumnos);
