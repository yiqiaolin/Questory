import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db, auth } from "./firebase.js";

export async function createUserIfNotExist(user) {

    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
        await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            createdAt: Date.now(),
            level: 0,
            title:[],
            exp:0
        });
    }
}