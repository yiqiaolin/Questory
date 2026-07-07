import { db } from "./firebase.js";
import { arrayUnion, collection, doc, getDoc, addDoc, getDocs, updateDoc} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ----------函式定義----------

// 資料庫新增任務文件  輸入:新增任務modal輸入之副本名、類型、獎勵值、描述
export async function createTask(name, type, reward, desc){
    await addDoc(collection(db, "tasks"), {
        name: name,
        type: type,
        reward: reward,
        description: desc
    });
}