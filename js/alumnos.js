import { checkAuthentication } from "./auth.js";
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

// Check authentication
checkAuthentication()
  .then(user => {
    console.log(`Bienvenido, ${user.email}`);
    document.querySelector("main").style.display = "block"; // Mostrar contenido
  })
  .catch(error => {
    alert(error);
    window.location.href = "index.html"; // Redirigir si no está autorizado
  });

// References to collections
const alumnosRef = collection(db, "Alumnos");
const turnosRef = collection(db, "Turnos");

// DOM elements
const alumnosTableBody = document.querySelector("#alumnos-table tbody");
const modal = document.querySelector("#modal-form");
const form = document.querySelector("#abm-form");
const turnoSelect = document.getElementById("turno-select");
const modalTitle = document.querySelector("#modal-title");
const closeModalButton = document.querySelector(".close");
const paginationContainer = document.querySelector("#pagination-controls");
const alumnosCounter = document.getElementById("alumnos-counter");

if (!alumnosTableBody || !modal || !form || !turnoSelect || !modalTitle || !closeModalButton || !paginationContainer || !alumnosCounter) {
  console.error("Error: Missing DOM elements.");
  alert("Hubo un error al cargar la página. Por favor, inténtelo de nuevo.");
  throw new Error("Missing DOM elements.");
}

let editing = false;
let editingId = null;
let allTurnos = {}; // Mapeo de IDs de turnos a nombres
let allAlumnos = []; // Lista completa de alumnos para la paginación

// Variables for pagination
let currentPage = 1;
const recordsPerPage = 10;

// Load turnos and fill the select dynamically
async function loadTurnos() {
  try {
    const snapshot = await getDocs(turnosRef);
    turnoSelect.innerHTML = ""; // Clear the select before filling it

    snapshot.docs.forEach(doc => {
      const turno = doc.data();
      allTurnos[doc.id] = turno.Turno; // Map ID -> Name
      turnoSelect.innerHTML += `<option value="${doc.id}">${turno.Turno}</option>`;
    });
  } catch (error) {
    console.error("Error loading turnos:", error);
    alert("Hubo un error al cargar los turnos.");
  }
}

// Load alumnos from Firestore and sort them by apellido in ascending order
async function loadAlumnos() {
  try {
    const snapshot = await getDocs(alumnosRef);
    const alumnos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by apellido in ascending order
    alumnos.sort((a, b) => a.Apellido.localeCompare(b.Apellido));

    allAlumnos = alumnos; // Save all alumnos in a global variable
    paginateAlumnos(alumnos); // Call the pagination function
  } catch (error) {
    console.error("Error loading alumnos:", error);
    alert("Hubo un error al cargar los alumnos.");
  }
}

// Function to handle pagination
function paginateAlumnos(alumnos) {
  const totalPages = Math.ceil(alumnos.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const alumnosToDisplay = alumnos.slice(startIndex, endIndex);

  displayAlumnos(alumnosToDisplay);
  renderPaginationControls(totalPages);

  // Update alumnos counter
  alumnosCounter.textContent = `CANTIDAD DE ALUMNOS: ${alumnos.length}`;
}

// Display pagination controls
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

// Display alumnos in the table
function displayAlumnos(alumnos) {
  alumnosTableBody.innerHTML = alumnos
    .map(alumno => {
      const turnoNombre = allTurnos[alumno.Turnos] || "Turno no encontrado";
      return `
      <tr>
        <td>${alumno.Nombre}</td>
        <td>${alumno.Apellido}</td>
        <td>${alumno.Fecha_nac ? alumno.Fecha_nac.toDate().toLocaleDateString() : "Sin fecha"}</td>
        <td>${alumno.Tel || "Sin teléfono"}</td>
        <td>${alumno.FM ? "Sí" : "No"}</td>
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

// Handle form submission (Add/Edit)
async function handleFormSubmit(event) {
  event.preventDefault();

  const nombre = form.nombre.value.trim();
  const apellido = form.apellido.value.trim();
  const fechaNac = form["fecha-nac"].value.trim();
  const tel = form.tel.value.trim();
  const fm = form.fm.checked;
  const dni = form.dni.value.trim();
  const turno = form.turno.value.trim();

  if (!nombre || !apellido || !dni || !turno) {
    alert("Todos los campos obligatorios deben ser completados.");
    return;
  }

  const data = {
    Nombre: nombre,
    Apellido: apellido,
    Fecha_nac: fechaNac ? new Date(fechaNac) : null,
    Tel: tel ? parseInt(tel, 10) : null,
    FM: fm,
    DNI: dni,
    Turnos: turno,
  };

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
    console.error("Error saving alumno:", error);
    alert("Hubo un error al guardar el alumno.");
  }
}

// Delete an alumno
async function handleDelete(event) {
  const id = event.target.dataset.id;

  if (confirm("¿Estás seguro de que deseas eliminar este alumno?")) {
    try {
      const docRef = doc(db, "Alumnos", id);
      await deleteDoc(docRef);
      loadAlumnos();
    } catch (error) {
      console.error("Error deleting alumno:", error);
      alert("Hubo un error al eliminar el alumno.");
    }
  }
}

// Open modal
async function openModal(id = null) {
  editing = !!id;
  editingId = id;
  modalTitle.textContent = editing ? "Editar Alumno" : "Agregar Alumno";

  await loadTurnos(); // Load turnos before opening the modal

  if (editing) {
    try {
      const docRef = doc(db, "Alumnos", id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const alumno = snapshot.data();
        form.nombre.value = alumno.Nombre;
        form.apellido.value = alumno.Apellido;
        form["fecha-nac"].value = alumno.Fecha_nac ? alumno.Fecha_nac.toDate().toISOString().split("T")[0] : "";
        form.tel.value = alumno.Tel || "";
        form.fm.checked = alumno.FM || false;
        form.dni.value = alumno.DNI;
        form.turno.value = alumno.Turnos;
      } else {
        alert("El documento no existe.");
      }
    } catch (error) {
      console.error("Error getting alumno:", error);
      alert("Hubo un error al obtener los datos del alumno.");
    }
  } else {
    form.reset();
  }

  modal.style.display = "flex";
}

// Close modal without saving
function closeModal() {
  modal.style.display = "none";
  editing = false;
  editingId = null;
  form.reset();
}

// Attach dynamic events
function attachEventListeners() {
  document.querySelectorAll(".edit").forEach(button => {
    button.addEventListener("click", event => openModal(event.target.dataset.id));
  });

  document.querySelectorAll(".delete").forEach(button => {
    button.addEventListener("click", handleDelete);
  });
}

// Global events
document.querySelector("#add-alumno").addEventListener("click", () => openModal());
form.addEventListener("submit", handleFormSubmit);
closeModalButton.addEventListener("click", closeModal);

// Initialize
loadTurnos().then(loadAlumnos);
