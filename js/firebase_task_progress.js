import { db } from "./firebase.js";
import { doc, setDoc, query, where, collection, getDocs} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import * as taskApi from "./firebase_task.js";


// ----------函式定義----------

// 在接任務時新增資料  輸入:副本ID 任務ID 使用者ID
export async function createTaskProgress(roomId, taskId, uid) {

    const progressId = `${roomId}_${taskId}_${uid}`;
    const ref = doc(db, "task_progress", progressId);
    const taskName = await taskApi.idGetName(taskId);

    await setDoc(ref, {
        roomId: roomId,
        taskId: taskId,
        uid: uid,
        taskName: taskName,
        status: "in_progress"
    });
}

// 取得當前使用者的待辦清單  輸入:使用者ID 輸出:文件物件
export async function getTaskProgress(userId){
    const q = query(
        collection(db, "task_progress"),
        where("uid", "==", userId)
    );

    const snap = await getDocs(q);
    const progressList = [];
    snap.forEach((doc)=>{
        progressList.push({
            id: doc.id,
            ...doc.data()
        });
    });

    return progressList;
}