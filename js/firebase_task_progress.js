import { db } from "./firebase.js";
import { doc, setDoc, query, where, collection, getDoc, getDocs, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import * as taskApi from "./firebase_task.js";
import * as userApi from "./firebase_user.js";


// ----------函式定義----------

// 在接任務時新增資料  輸入:副本ID 任務ID 使用者ID
export async function createTaskProgress(roomId, taskId, uid) {

    const progressId = `${roomId}_${taskId}_${uid}`;
    const ref = doc(db, "task_progress", progressId);
    const taskName = await taskApi.idGetName(taskId);
    const userName = await userApi.uidGetName(uid);

    await setDoc(ref, {
        roomId: roomId,
        taskId: taskId,
        uid: uid,
        userName: userName,
        taskName: taskName,
        status: "in_progress",
        proofImages: []
    });
}

// 取得當前使用者的待辦清單  輸入:使用者ID 房間ID 輸出:文件陣列
export async function getTaskProgress(userId, roomId){
    const q = query(
        collection(db, "task_progress"),
        where("uid", "==", userId),
        where("roomId", "==", roomId)
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

// 新增證明圖片  輸入:副本ID 任務ID 使用者ID 圖片路徑
export async function addProofImage(roomId, taskId, uid, imageUrl){
    const progressId = `${roomId}_${taskId}_${uid}`;
    const ref = doc(db, "task_progress", progressId);

    await updateDoc(ref, {
        proofImages: arrayUnion(imageUrl)
    });
}

// 狀態更改  輸入:過程ID 狀態
export async function changeStatus(progressId, status){
    const ref = doc(db, "task_progress", progressId);

    await updateDoc(ref, {
        status: status
    });
}

// 取得狀態為submitted的任務  輸入:房間ID 輸出:文件陣列
export async function getSubmittedProgress(roomId){
    const q = query(
        collection(db, "task_progress"),
        where("roomId", "==", roomId),
        where("status", "==", "submitted")
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

// 取得單筆過程資料  輸入:過程ID
export async function getTaskProgressData(id) {

    const ref = doc(db, "task_progress", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return null;
    }

    return {
        id: snap.id,
        ...snap.data()
    };
}

// 清空proofImages  輸入:過程ID
export async function clearProofImages(id) {

    const ref = doc(db, "task_progress", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return null;
    }

    await updateDoc(ref, {
        proofImages: []
    });
}