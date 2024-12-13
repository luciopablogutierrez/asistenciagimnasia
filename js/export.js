import { checkAuthentication } from "./auth.js";

checkAuthentication()
  .then(user => {
    console.log(`Bienvenido, ${user.email}`);
    document.querySelector("main").style.display = "block"; // Mostrar contenido
  })
  .catch(error => {
    alert(error);
    window.location.href = "index.html"; // Redirigir si no está autorizado
  });
  
import { db } from "./firebase-config.js";
import { collection, getDocs, doc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Referencias a las colecciones
const profesoresRef = collection(db, "Profesores");
const alumnosRef = collection(db, "Alumnos");
const turnosRef = collection(db, "Turnos");
const asistenciasRef = collection(db, "Asistencias");
const asistenciasProfesRef = collection(db, "Asistencia_profes");

// Objeto para mapear IDs a nombres
let allTurnos = {};
let allAlumnos = {};

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

// Función para cargar alumnos y mapear ID -> Nombre Completo
async function loadAlumnos() {
  try {
    const snapshot = await getDocs(alumnosRef);
    snapshot.docs.forEach(doc => {
      const alumno = doc.data();
      allAlumnos[doc.id] = `${alumno.Nombre} ${alumno.Apellido}`; // Mapeo ID -> Nombre Completo
    });
  } catch (error) {
    console.error("Error cargando alumnos:", error);
    alert("Hubo un error al cargar los alumnos.");
  }
}

// Función para convertir datos en formato CSV
function convertToCSV(data, headers) {
  const csvRows = [];
  csvRows.push(headers.join(",")); // Agregar encabezados

  data.forEach(item => {
    const row = headers.map(header => `"${item[header] || ""}"`);
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
        DNI: data.DNI,
        Turno: allTurnos[data.Turnos] || "Turno no encontrado", // Reemplazar ID por Nombre
      };
    });

    const headers = ["Nombre", "Apellido", "DNI", "Turno"];
    const csvData = convertToCSV(alumnos, headers);
    downloadCSV(csvData, "alumnos.csv");
  } catch (error) {
    console.error("Error exportando alumnos:", error);
    alert("Hubo un error al exportar los alumnos.");
  }
}

// Función para exportar profesores
async function exportProfesores() {
  try {
    await loadTurnos(); // Asegurar que los turnos estén cargados
    const snapshot = await getDocs(profesoresRef);

    const profesores = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        Nombre: data.Nombre,
        Apellido: data.Apellido,
        DNI: data.DNI,
        Turno: allTurnos[data.Turno] || "Turno no encontrado", // Reemplazar ID por Nombre
      };
    });

    const headers = ["Nombre", "Apellido", "DNI", "Turno"];
    const csvData = convertToCSV(profesores, headers);
    downloadCSV(csvData, "profesores.csv");
  } catch (error) {
    console.error("Error exportando profesores:", error);
    alert("Hubo un error al exportar los profesores.");
  }
}

// Función para exportar asistencias
async function exportAsistencias() {
  try {
    await Promise.all([loadTurnos(), loadAlumnos()]); // Cargar turnos y alumnos antes de exportar
    const snapshot = await getDocs(asistenciasRef);

    const asistencias = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        Alumno: allAlumnos[data.AlumnoId] || "Alumno no encontrado",
        Fecha: data.Fecha || "Fecha no registrada",
        Turno: allTurnos[data.Turno] || "Turno no encontrado",
        Asistio: data.Asistio ? "Sí" : "No",
      };
    });

    const headers = ["Alumno", "Fecha", "Turno", "Asistio"];
    const csvData = convertToCSV(asistencias, headers);
    downloadCSV(csvData, "asistencias.csv");
  } catch (error) {
    console.error("Error exportando asistencias:", error);
    alert("Hubo un error al exportar las asistencias.");
  }
}

// Función para exportar asistencias de profesores
async function exportAsistenciasProfesores() {
  try {
    // Cargar profesores y turnos en memoria
    const profesoresSnapshot = await getDocs(profesoresRef);
    const turnosSnapshot = await getDocs(turnosRef);

    const allProfesores = {};
    const allTurnos = {};

    // Mapear IDs de profesores a nombres completos
    profesoresSnapshot.docs.forEach(doc => {
      const profesorData = doc.data();
      allProfesores[doc.id] = `${profesorData.Nombre} ${profesorData.Apellido}`;
    });

    // Mapear IDs de turnos a nombres de turnos
    turnosSnapshot.docs.forEach(doc => {
      const turnoData = doc.data();
      allTurnos[doc.id] = turnoData.Turno;
    });

    // Cargar asistencias de profesores
    const snapshot = await getDocs(asistenciasProfesRef);

    const asistencias = snapshot.docs.map(doc => {
      const data = doc.data();

      const profesorNombre = allProfesores[data.ProfeId] || "Profesor no encontrado";
      const turnoNombre = allTurnos[data.Turno] || "Turno no encontrado";

      return {
        Profesor: profesorNombre,
        Fecha: data.Fecha,
        Turno: turnoNombre,
        Asistio: data.Asistio ? "Sí" : "No",
      };
    });

    const headers = ["Profesor", "Fecha", "Turno", "Asistio"];
    const csvData = convertToCSV(asistencias, headers);
    downloadCSV(csvData, "asistencias_profesores.csv");
  } catch (error) {
    console.error("Error exportando asistencias de profesores:", error);
    alert("Hubo un error al exportar las asistencias de profesores.");
  }
}


// Asociar eventos a los botones de exportación
document.getElementById("export-alumnos").addEventListener("click", exportAlumnos);
document.getElementById("export-profesores").addEventListener("click", exportProfesores);
document.getElementById("export-asistencias").addEventListener("click", exportAsistencias);
document.getElementById("export-asistencias-profesores").addEventListener("click", exportAsistenciasProfesores);
