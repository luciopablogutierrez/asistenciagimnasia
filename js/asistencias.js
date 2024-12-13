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
import { collection, getDocs, query, where, setDoc, doc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Referencias a las colecciones
const alumnosRef = collection(db, "Alumnos");
const turnosRef = collection(db, "Turnos");
const asistenciasRef = collection(db, "Asistencias");

const asistenciasTableBody = document.querySelector("#asistencias-table tbody");
const fechaInput = document.querySelector("#fecha");
const turnoSelect = document.querySelector("#turno");
const saveAsistenciasButton = document.querySelector("#save-asistencias");
const loader = document.querySelector("#loader");
const messageBox = document.querySelector("#message-box");

let alumnosList = [];
let turnosList = [];

// Restringir el campo de fecha para no permitir fechas mayores a hoy (hasta las 00:00)
const hoy = new Date();
hoy.setHours(0, 0, 0, 0); // Asegurarse de que el tiempo es 00:00
fechaInput.setAttribute("max", hoy.toISOString().split("T")[0]);


// Mostrar mensajes al usuario
function showMessage(message, type) {
  if (messageBox) {
    messageBox.textContent = message;
    messageBox.className = type;
    setTimeout(() => {
      messageBox.textContent = "";
      messageBox.className = "";
    }, 3000);
  }
}

// Mostrar u ocultar el loader
function showLoader(show) {
  loader.style.display = show ? "block" : "none";
}

// Cargar turnos dinámicamente en el select
async function loadTurnos() {
  try {
    const snapshot = await getDocs(turnosRef);
    turnoSelect.innerHTML = `<option value="">Seleccione un turno</option>`; // Limpia el select y añade una opción por defecto

    turnosList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    turnosList.forEach(turno => {
      turnoSelect.innerHTML += `<option value="${turno.id}">${turno.Turno}</option>`;
    });
  } catch (error) {
    console.error("Error al cargar turnos:", error);
    showMessage("Error al cargar turnos: " + error.message, "error");
  }
}

// Cargar alumnos correspondientes al turno seleccionado
async function loadAlumnos() {
  const turnoId = turnoSelect.value;
  const fechaSeleccionada = fechaInput.value;

  if (!fechaSeleccionada || !turnoId) {
    showMessage("Debe seleccionar una fecha y un turno.", "error");
    return;
  }

  showLoader(true);
  try {
    const q = query(alumnosRef, where("Turnos", "==", turnoId)); // Filtrar alumnos por turno
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showMessage("No se encontraron alumnos para el turno seleccionado.", "info");
      asistenciasTableBody.innerHTML = "<tr><td colspan='2'>No hay alumnos disponibles.</td></tr>";
      return;
    }

    alumnosList = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    renderTable(); // Renderiza la tabla con los alumnos cargados
  } catch (error) {
    console.error("Error al cargar alumnos:", error);
    showMessage("Error al cargar alumnos: " + error.message, "error");
  } finally {
    showLoader(false);
  }
}

// Renderizar la tabla con los alumnos cargados
function renderTable() {
  asistenciasTableBody.innerHTML = alumnosList
    .map(
      alumno => `
        <tr>
          <td>${alumno.Nombre} ${alumno.Apellido}</td>
          <td>
            <input type="checkbox" data-id="${alumno.id}" />
          </td>
        </tr>
      `
    )
    .join("");
}

// Guardar asistencias en Firestore sin duplicados
async function saveAsistencias() {
  const turnoId = turnoSelect.value;
  const fechaSeleccionada = fechaInput.value;

  if (!fechaSeleccionada || !turnoId) {
    showMessage("Debe seleccionar una fecha y un turno antes de guardar.", "error");
    return;
  }

  const asistencias = Array.from(asistenciasTableBody.querySelectorAll("tr")).map(row => {
    const alumnoId = row.querySelector("input[type='checkbox']").dataset.id;
    const asistio = row.querySelector("input[type='checkbox']").checked;
    return {
      AlumnoId: alumnoId,
      Asistio: asistio,
      Fecha: fechaSeleccionada,
      Turno: turnoId,
    };
  });

  showLoader(true);
  try {
    for (const asistencia of asistencias) {
      // Crear un ID único basado en Fecha, Alumno y Turno
      const docId = `${asistencia.Fecha}_${asistencia.AlumnoId}_${asistencia.Turno}`;
      console.log(`Procesando docId: ${docId}`); // Depuración del ID

      // Sobrescribir documento con setDoc
      const asistenciaDoc = doc(asistenciasRef, docId);
      await setDoc(asistenciaDoc, asistencia);
    }
    showMessage("Asistencias guardadas correctamente.", "success");
  } catch (error) {
    console.error("Error al guardar asistencias:", error);
    showMessage("Error al guardar asistencias: " + error.message, "error");
  } finally {
    showLoader(false);
  }
}

// Event Listeners
turnoSelect.addEventListener("change", loadAlumnos); // Cargar alumnos automáticamente al seleccionar turno
fechaInput.addEventListener("change", loadAlumnos); // Refrescar alumnos al cambiar fecha
saveAsistenciasButton.addEventListener("click", saveAsistencias);

// Inicializar carga de turnos al cargar la página
loadTurnos();
