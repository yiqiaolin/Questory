import { db } from "./firebase.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function createRoom(name, description, date, user) {
  await addDoc(collection(db, "rooms"), {
    name: name,
    date: date,
    description: description,
    status: "prepare",
    owner: user
  });
}

export async function getRooms() {
  const snapshot = await getDocs(collection(db, "rooms"));
  const rooms = [];

  snapshot.forEach((doc) => {
    rooms.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return rooms;
}