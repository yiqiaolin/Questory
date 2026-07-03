import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";
import { db, auth } from "./firebase.js";


// ----------函式定義----------

// 在資料庫新增使用者資料  輸入:當前登入使用者資料(auth)
export async function createUserIfNotExist(user) {

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        await setDoc(ref, {
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

// uid查詢name 輸入:uid 輸出:name 
export async function UidToName(uid) {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    if (snap.exists()){
        const userData = snap.data();
        return userData.name;
    }
    return null;
}