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
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Referencias a las colecciones
const alumnosRef = collection(db, "Alumnos");
const turnosRef = collection(db, "Turnos");

// Elementos del DOM
const alumnosTableBody = document.querySelector("#alumnos-table tbody");
const modal = document.querySelector("#modal-form");
const form = document.querySelector("#abm-form");
const turnoSelect = document.getElementById("turno-select");
const modalTitle = document.querySelector("#modal-title");
const closeModalButton = document.querySelector(".close");
const paginationContainer = document.querySelector("#pagination-controls");
const alumnosCounter = document.getElementById("alumnos-counter");

let editing = false;
let editingId = null;
let allTurnos = {}; // Mapeo de IDs de turnos a nombres
let allAlumnos = []; // Lista completa de alumnos para la paginación

// Variables para la paginación
let currentPage = 1;
const recordsPerPage = 10;

// Cargar turnos y llenar el select dinámicamente
async function loadTurnos() {
  try {
    const snapshot = await getDocs(turnosRef);
    turnoSelect.innerHTML = ""; // Limpia el select antes de llenarlo

    snapshot.docs.forEach(doc => {
      const turno = doc.data();
      allTurnos[doc.id] = turno.Turno; // Mapeo ID -> Nombre
      turnoSelect.innerHTML += `<option value="${doc.id}">${turno.Turno}</option>`;
    });
  } catch (error) {
    console.error("Error cargando turnos:", error);
    alert("Hubo un error al cargar los turnos.");
  }
}

// Cargar alumnos desde Firestore y ordenarlos por apellido de forma ascendente
async function loadAlumnos() {
  try {
    const snapshot = await getDocs(alumnosRef);
    const alumnos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar por apellido de manera ascendente
    alumnos.sort((a, b) => a.Apellido.localeCompare(b.Apellido));

    allAlumnos = alumnos; // Guardar todos los alumnos en una variable global
    paginateAlumnos(alumnos); // Llamar a la función de paginación
  } catch (error) {
    console.error("Error cargando alumnos:", error);
    alert("Hubo un error al cargar los alumnos.");
  }
}

// Función para manejar la paginación
function paginateAlumnos(alumnos) {
  const totalPages = Math.ceil(alumnos.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const alumnosToDisplay = alumnos.slice(startIndex, endIndex);

  displayAlumnos(alumnosToDisplay);
  renderPaginationControls(totalPages);

  // Actualizar contador de alumnos
  alumnosCounter.textContent = `CANTIDAD DE ALUMNOS: ${alumnos.length}`;
}


// Mostrar controles de paginación
function renderPaginationControls(totalPages) {
  paginationContainer.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.className = i === currentPage ? "active" : "";
    button.addEventListener("click", () => {
      currentPage = i;
      paginateAlumnos(allAlumnos);
    });
    paginationContainer.appendChild(button);
  }
}

// Mostrar alumnos en la tabla
function displayAlumnos(alumnos) {
  alumnosTableBody.innerHTML = alumnos
    .map(alumno => {
      const turnoNombre = allTurnos[alumno.Turnos] || "Turno no encontrado";
      return `
      <tr>
        <td>${alumno.Nombre}</td>
        <td>${alumno.Apellido}</td>
        <td>${alumno.DNI}</td>
        <td>${turnoNombre}</td>
        <td>
          <button class="edit" data-id="${alumno.id}">Editar</button>
          <button class="delete" data-id="${alumno.id}">Eliminar</button>
        </td>
      </tr>`;
    })
    .join("");

  attachEventListeners();
}

// Manejar formulario (Agregar/Editar)
async function handleFormSubmit(event) {
  event.preventDefault();

  const nombre = form.nombre.value.trim();
  const apellido = form.apellido.value.trim();
  const dni = form.dni.value.trim();
  const turno = form.turno.value.trim();

  if (!nombre || !apellido || !dni || !turno) {
    alert("Todos los campos son obligatorios.");
    return;
  }

  const data = { Nombre: nombre, Apellido: apellido, DNI: dni, Turnos: turno };

  try {
    if (editing) {
      const docRef = doc(db, "Alumnos", editingId);
      await updateDoc(docRef, data);
    } else {
      await addDoc(alumnosRef, data);
    }

    closeModal();
    loadAlumnos();
  } catch (error) {
    console.error("Error al guardar el alumno:", error);
    alert("Hubo un error al guardar el alumno.");
  }
}

// Eliminar un alumno
async function handleDelete(event) {
  const id = event.target.dataset.id;

  if (confirm("¿Estás seguro de que deseas eliminar este alumno?")) {
    try {
      const docRef = doc(db, "Alumnos", id);
      await deleteDoc(docRef);
      loadAlumnos();
    } catch (error) {
      console.error("Error al eliminar el alumno:", error);
      alert("Hubo un error al eliminar el alumno.");
    }
  }
}

// Abrir modal
async function openModal(id = null) {
  editing = !!id;
  editingId = id;
  modalTitle.textContent = editing ? "Editar Alumno" : "Agregar Alumno";

  await loadTurnos(); // Cargar turnos antes de abrir el modal

  if (editing) {
    try {
      const docRef = doc(db, "Alumnos", id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const alumno = snapshot.data();
        form.nombre.value = alumno.Nombre;
        form.apellido.value = alumno.Apellido;
        form.dni.value = alumno.DNI;
        form.turno.value = alumno.Turnos;
      } else {
        alert("El documento no existe.");
      }
    } catch (error) {
      console.error("Error obteniendo el alumno:", error);
      alert("Hubo un error al obtener los datos del alumno.");
    }
  } else {
    form.reset();
  }

  modal.style.display = "flex";
}

// Cerrar modal sin guardar
function closeModal() {
  modal.style.display = "none";
  editing = false;
  editingId = null;
  form.reset();
}

// Adjuntar eventos dinámicos
function attachEventListeners() {
  document.querySelectorAll(".edit").forEach(button => {
    button.addEventListener("click", event => openModal(event.target.dataset.id));
  });

  document.querySelectorAll(".delete").forEach(button => {
    button.addEventListener("click", handleDelete);
  });
}

// Eventos globales
document.querySelector("#add-alumno").addEventListener("click", () => openModal());
form.addEventListener("submit", handleFormSubmit);
closeModalButton.addEventListener("click", closeModal);

// Inicializar
loadTurnos().then(loadAlumnos);
