import { db } from "./firebase.js";
import { arrayUnion, collection, doc, getDoc, addDoc, getDocs, updateDoc} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ----------函式定義----------

// 資料庫新增任務文件  輸入:新增任務modal輸入之副本名、類型、獎勵值、描述 輸出:文件ID
export async function createTask(name, type, reward, desc){
    const docRef = await addDoc(collection(db, "tasks"), {
        name: name,
        type: type,
        reward: reward,
        description: desc
    });
    return docRef.id;
}

// 取得輸入任務ID之任務名稱  輸入:任務ID 輸出:任務名稱
export async function idGetName(id){
    const ref = doc(db, "tasks", id);
    const snap = await getDoc(ref);
    if (snap.exists()){
        const taskData = snap.data();
        return taskData.name;
    }
    return null;
}