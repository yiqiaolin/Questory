import { db } from "./firebase.js";
import { arrayUnion, collection, doc, getDoc, addDoc, getDocs, updateDoc, increment} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ----------函式定義----------

// 資料庫新增副本文件  輸入:新增副本modal輸入之副本名、描述、日期和當前使用者Uid
export async function createRoom(name, description, date, userUid) {
  await addDoc(collection(db, "rooms"), {
    name: name,
    startDate: date,
    endDate: null,
    description: description,
    status: "prepare",
    owner: userUid,
    members: [{uid: userUid, status: "accepted"}],
    tasks: [],
    members_reward: {[userUid]: 0},
    total: 0
  });
}

// 取得所有副本文件資料  輸出:所有副本文件資料物件之陣列
export async function getRoomList() {
  const snap = await getDocs(collection(db, "rooms"));
  const rooms = [];

  snap.forEach((doc) => {
    rooms.push({
      id: doc.id,
      ...doc.data()
    });
  });

  return rooms;
}

// 取得單筆副本資料  輸入:副本ID 輸出:副本資料物件
export async function getRoomData(id) {
    const ref = doc(db, "rooms", id);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
        return null;
    }

    return {
        id: snap.id,
        ...snap.data()
    };
}

// 允許成員加入副本申請 變更資料庫從pending->accepted  輸入:副本ID、目標編輯成員之uid
export async function acceptMember(roomId, targetUid) {
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const members = data.members || [];

    // 這裡會回傳新的members陣列並放到updatedMembers
    const updatedMembers = members.map(member => {
        if (member.uid === targetUid) {
            return { ...member, status: "accepted" };
        }
        return member;
    });

    await updateDoc(ref, {
        members: updatedMembers
    });
}

// 拒絕成員加入副本申請 移除資料庫members欄位對應成員  輸入:副本ID、目標編輯成員之uid
export async function deleteMember(roomId, targetUid) {
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    const data = snap.data();
    const members = data.members || [];

    // 這裡會回傳新的members陣列並放到updatedMembers
    const updatedMembers = members.filter(member => {
        return member.uid !== targetUid;u
    });

    await updateDoc(ref, {
        members: updatedMembers
    });
}

// 申請加入副本 新增資料庫members欄位  輸入:欲申請副本ID、申請人ID 輸出:找不到副本輸出null 已加入輸出1
export async function joinRoom(roomId, targetUid){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }

    const members = snap.data().members;
    const isMember = members.some(m => m.uid === targetUid);
    if (isMember){
        return 1;
    }
    await updateDoc(ref, {
        members: arrayUnion({
            uid: targetUid,
            status: "pending"
        })
    });
    return 3;
}

// 取得副本擁有者資訊  輸入:副本ID
export async function getOwner(roomId){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }

    const owner = snap.data().owner;
    return owner;
}

// 取得副本描述資訊  輸入:副本ID
export async function getDesc(roomId){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }

    const desc = snap.data().description;
    return desc;
}

// 退出副本 移除資料庫members對應欄位  輸入:欲退出副本ID、退出人ID
export async function exitRoom(roomId, targetUid){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }
    const members = snap.data().members;
    const updatedMembers = members.filter(member => member.uid !== targetUid);
    await updateDoc(ref, {
        members: updatedMembers
    });
}

// 新增任務ID到房間任務列表  輸入:副本ID、任務ID
export async function addTaskToRoom(roomId, taskId){
    const ref = doc(db, "rooms", roomId);
    await updateDoc(ref, {
        tasks: arrayUnion(taskId)
    });
}

// 取得副本擁有者資訊  輸入:副本ID
export async function getStatus(roomId){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }

    const status = snap.data().status;
    return status;
}

// 變更房間狀態prepare->process  輸入:副本ID
export async function PrepareToProcess(roomId){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }
    let status = snap.data().status;
    status = "process";
    await updateDoc(ref, {
        status: status
    });
}

// 變更房間狀態process->finish  輸入:副本ID
export async function ProcessToFinish(roomId){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }
    let status = snap.data().status;
    status = "finish";
    await updateDoc(ref, {
        status: status
    });
}

// 認證任務成功後增加exp值  輸入:副本ID 成員ID exp值
export async function addExpValues(roomId, uid, exp){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }
    const roomData = snap.data();
    if (roomData.members_reward[uid] === undefined) {
        await updateDoc(ref, {
            [`members_reward.${uid}`]: 0
        });
    }
    await updateDoc(ref, {
        [`members_reward.${uid}`]: increment(exp)
    });
}

// 新增成員時新增members_reward項
export async function addMembersRewardItem(roomId, uid){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }
    const members_reward = snap.data().members_reward;
    await updateDoc(ref, {
        [`members_reward.${uid}`]: 0
    });
}

// 成員退出時移除members_reward項
export async function deleteMembersRewardItem(roomId, uid){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }
    const members_reward = snap.data().members_reward;
    delete members_reward[uid];
    await updateDoc(ref, {
        members_reward: members_reward
    });
}

// 認證任務成功後總共完成件數加一  輸入:副本ID
export async function addTotalValues(roomId){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }

    await updateDoc(ref, {
        total: increment(1)
    });
}

// 透過members_reward獲取排行榜資料  輸入:副本ID 輸出:排行榜資料陣列
export async function getRankings(roomId){
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        return null;
    }

    const members_reward = snap.data().members_reward;

    const top3 = Object.entries(members_reward)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3);
    
    return top3;
}

// 結束副本時寫入結束時間  輸入:副本ID 結束日期
export async function addEndDate(roomId, date){
    const ref = doc(db,"rooms",roomId);

    await updateDoc(ref,{
        endDate: date
    });
}