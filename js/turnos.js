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
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Referencia a la colección de Turnos
const turnosRef = collection(db, "Turnos");

// Elementos del DOM
const turnosTableBody = document.querySelector("#turnos-table tbody");
const modal = document.querySelector("#modal-form");
const form = document.querySelector("#abm-form");
const modalTitle = document.querySelector("#modal-title");
const closeModalButton = document.querySelector(".close");

let editing = false;
let editingId = null;

// Cargar turnos desde Firestore
async function loadTurnos() {
  try {
    const snapshot = await getDocs(turnosRef);

    // Ordenar los turnos alfabéticamente en orden ascendente
    const sortedDocs = snapshot.docs.sort((b, a) => {
      const turnoA = a.data().Turno.toLowerCase();
      const turnoB = b.data().Turno.toLowerCase();
      return turnoB.localeCompare(turnoA);
    });

    // Renderizar los turnos en la tabla
    turnosTableBody.innerHTML = sortedDocs
      .map(
        doc => `
        <tr>
          <td>${doc.data().Turno}</td>
          <td>
            <button class="edit" data-id="${doc.id}">Editar</button>
            <button class="delete" data-id="${doc.id}">Eliminar</button>
          </td>
        </tr>
      `
      )
      .join("");

    attachEventListeners();
  } catch (error) {
    console.error("Error cargando turnos:", error);
    alert("Hubo un error al cargar los turnos.");
  }
}

// Manejar formulario (Agregar/Editar)
async function handleFormSubmit(event) {
  event.preventDefault();

  const turno = form.turno.value.trim();

  if (!turno) {
    alert("El nombre del turno es obligatorio.");
    return;
  }

  const data = { Turno: turno };

  try {
    if (editing) {
      const docRef = doc(db, "Turnos", editingId);
      await updateDoc(docRef, data);
    } else {
      await addDoc(turnosRef, data);
    }

    closeModal();
    loadTurnos();
  } catch (error) {
    console.error("Error al guardar el turno:", error);
    alert("Hubo un error al guardar el turno.");
  }
}

// Eliminar un turno
async function handleDelete(event) {
  const id = event.target.dataset.id;

  if (confirm("¿Estás seguro de que deseas eliminar este turno?")) {
    try {
      const docRef = doc(db, "Turnos", id);
      await deleteDoc(docRef);
      loadTurnos();
    } catch (error) {
      console.error("Error al eliminar el turno:", error);
      alert("Hubo un error al eliminar el turno.");
    }
  }
}

// Abrir modal
async function openModal(id = null) {
  editing = !!id;
  editingId = id;
  modalTitle.textContent = editing ? "Editar Turno" : "Agregar Turno";

  if (editing && id) {
    try {
      const docRef = doc(db, "Turnos", id);
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        form.turno.value = data.Turno;
      } else {
        alert("El documento no existe.");
      }
    } catch (error) {
      console.error("Error obteniendo el documento:", error);
      alert("Hubo un error al obtener los datos del turno.");
    }
  } else {
    form.reset();
  }

  modal.style.display = "flex";
}

// Cerrar modal sin guardar
function closeModal() {
  modal.style.display = "none"; // Oculta el modal
  editing = false; // Reinicia el estado de edición
  editingId = null; // Reinicia el ID
  form.reset(); // Limpia los campos del formulario
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
document.querySelector("#add-turno").addEventListener("click", () => openModal());
form.addEventListener("submit", handleFormSubmit);
closeModalButton.addEventListener("click", closeModal); // Ícono cerrar

// Inicializar carga de datos
loadTurnos();
