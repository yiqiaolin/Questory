import { db } from "./firebase.js";
import { collection, doc, getDoc, addDoc, getDocs, updateDoc} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function createRoom(name, description, date, user, userName) {
  await addDoc(collection(db, "rooms"), {
    name: name,
    date: date,
    description: description,
    status: "prepare",
    owner: user,
    members: [{name: userName, status: "accepted"}],
    task: []
  });
}

export async function getRoomList() {
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

export async function getRoomData(id) {
    const docRef = doc(db, "rooms", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
        return null;
    }

    return {
        id: docSnap.id,
        ...docSnap.data()
    };
}

export async function acceptMember(roomId, targetName) {
    const roomRef = doc(db, "rooms", roomId);

    const snapshot = await getDoc(roomRef);
    const data = snapshot.data();
    const members = data.members || [];

    const updatedMembers = members.map(member => {
        if (member.name === targetName) {
            return { ...member, status: "accepted" };
        }
        return member;
    });

    await updateDoc(roomRef, {
        members: updatedMembers
    });
}

export async function deleteMember(roomId, targetName) {

    const roomRef = doc(db, "rooms", roomId);

    const snapshot = await getDoc(roomRef);
    const data = snapshot.data();
    const members = data.members || [];

    const updatedMembers = members.filter(member => {
        return member.name !== targetName;
    });

    await updateDoc(roomRef, {
        members: updatedMembers
    });
}