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

import {
  getAllDocuments,
  addDocument,
  updateDocument,
  deleteDocument,
  getDocumentById
} from "./firebase-helpers.js";

// Referencias a las colecciones
const profesoresRef = collection(db, "Profesores");
const turnosRef = collection(db, "Turnos"); // Colección de turnos para llenar el dropdown

// Elementos del DOM
const profesoresTableBody = document.querySelector("#profesores-table tbody");
const modal = document.querySelector("#modal-form");
const form = document.querySelector("#abm-form");
const turnoSelect = document.querySelector("#turno-select"); // Dropdown para los turnos
const modalTitle = document.querySelector("#modal-title");
const closeModalButton = document.querySelector(".close");
const messageBox = document.querySelector("#message-box");
const confirmModal = document.querySelector("#confirm-modal");
const confirmYesButton = document.querySelector("#confirm-yes");
const confirmNoButton = document.querySelector("#confirm-no");
const loader = document.querySelector("#loader");

let editing = false;
let editingId = null;
let currentPage = 1;
let itemsPerPage = 5;
let allProfesores = [];
let allTurnos = {}; // Objeto para almacenar los turnos (ID -> Nombre)

// Cargar turnos y llenar el select dinámicamente
async function loadTurnos() {
  try {
    const snapshot = await getDocs(turnosRef);
    turnoSelect.innerHTML = ""; // Limpia el select antes de llenarlo

    snapshot.docs.forEach(doc => {
      const turno = doc.data();
      allTurnos[doc.id] = turno.Turno; // Mapea ID -> Nombre
      turnoSelect.innerHTML += `<option value="${doc.id}">${turno.Turno}</option>`;
    });
  } catch (error) {
    console.error("Error cargando turnos:", error);
    alert("Hubo un error al cargar los turnos.");
  }
}

// Cargar profesores desde Firestore
async function loadProfesores() {
  try {
    const snapshot = await getDocs(profesoresRef);
    allProfesores = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    displayProfesores();
  } catch (error) {
    console.error("Error cargando profesores:", error);
    alert("Hubo un error al cargar los profesores.");
  }
}

// Mostrar profesores en la tabla
function displayProfesores() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const profesoresToShow = allProfesores.slice(start, end);

  profesoresTableBody.innerHTML = profesoresToShow
    .map(profesor => {
      const turnoNombre = allTurnos[profesor.Turno] || "Turno no encontrado";
      return `
      <tr>
        <td>${profesor.Nombre}</td>
        <td>${profesor.Apellido}</td>
        <td>${profesor.DNI}</td>
        <td>${turnoNombre}</td>
        <td>
          <button class="edit" data-id="${profesor.id}">Editar</button>
          <button class="delete" data-id="${profesor.id}">Eliminar</button>
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

  const data = { Nombre: nombre, Apellido: apellido, DNI: dni, Turno: turno };

  try {
    if (editing) {
      const docRef = doc(db, "Profesores", editingId);
      await updateDoc(docRef, data);
    } else {
      await addDoc(profesoresRef, data);
    }

    closeModal();
    loadProfesores();
  } catch (error) {
    console.error("Error al guardar el profesor:", error);
    alert("Hubo un error al guardar el profesor.");
  }
}

// Eliminar un profesor
async function handleDelete(event) {
  const id = event.target.dataset.id;

  if (confirm("¿Estás seguro de que deseas eliminar este profesor?")) {
    try {
      const docRef = doc(db, "Profesores", id);
      await deleteDoc(docRef);
      loadProfesores();
    } catch (error) {
      console.error("Error al eliminar el profesor:", error);
      alert("Hubo un error al eliminar el profesor.");
    }
  }
}

// Abrir modal
async function openModal(id = null) {
  editing = !!id;
  editingId = id;
  modalTitle.textContent = editing ? "Editar Profesor" : "Agregar Profesor";

  if (editing && id) {
    try {
      const docRef = doc(db, "Profesores", id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        form.nombre.value = data.Nombre;
        form.apellido.value = data.Apellido;
        form.dni.value = data.DNI;
        form.turno.value = data.Turno;
      } else {
        alert("El documento no existe.");
      }
    } catch (error) {
      console.error("Error obteniendo el documento:", error);
      alert("Hubo un error al obtener los datos del profesor.");
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
document.querySelector("#add-profesor").addEventListener("click", () => openModal());
form.addEventListener("submit", handleFormSubmit);
closeModalButton.addEventListener("click", closeModal);

// Inicializar
loadTurnos().then(loadProfesores);
