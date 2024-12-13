import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";

// Función para obtener todos los documentos de una colección
export async function getAllDocuments(collectionRef) {
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Función para agregar un documento
export async function addDocument(collectionRef, data) {
  await addDoc(collectionRef, data);
}

// Función para actualizar un documento
export async function updateDocument(collectionRef, id, data) {
  const docRef = doc(collectionRef.firestore, collectionRef.path, id);
  await updateDoc(docRef, data);
}

// Función para eliminar un documento
export async function deleteDocument(collectionRef, id) {
  const docRef = doc(collectionRef.firestore, collectionRef.path, id);
  await deleteDoc(docRef);
}

// Función para obtener un documento por su ID
export async function getDocumentById(collectionRef, id) {
  const docRef = doc(collectionRef.firestore, collectionRef.path, id);
  const snapshot = await getDoc(docRef);
  return { id: snapshot.id, ...snapshot.data() };
}
