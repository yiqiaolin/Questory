import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as userApi from "./firebase_user.js";


// ----------物件取得----------

const editBtn = document.getElementById("edit-btn");
const itemArea = document.getElementById("item-area");
const userName = document.getElementById("user-name");
const userLevel = document.getElementById("user-level");

const editModal = (() => {
    const root = document.getElementById("edit-modal");
    return {
        root,
        createBtn: root.querySelector(".create-btn"),
        joinBtn: root.querySelector(".join-btn"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();

const createModal = (() => {
    const root = document.getElementById("create-modal");
    return {
        root,
        createBtn: root.querySelector(".create-btn"),
        questName: root.querySelector(".quest-name"),
        questDate: root.querySelector(".quest-date"),
        questDesc: root.querySelector(".quest-desc"),
        hint: root.querySelector(".hint"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();

const joinModal = (() => {
    const root = document.getElementById("join-modal");
    return {
        root,
        questCode: root.querySelector(".quest-code"),
        joinBtn: root.querySelector(".join-btn"),
        hint: root.querySelector(".hint"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();


// ----------函式定義----------

// 顯示副本列表  輸入:資料庫rooms集合內所有文件
function showRoomList(rooms) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    itemArea.innerHTML = rooms
        .filter(room =>room.members.some(member => member.uid === uid))
        .sort((a, b) => new Date(b.date) - new Date(a.date)) 
        .map(room => `
            <div class="item" data-id="${room.id}">
                <div class="item-container"> 
                    <p class="item-name">${room.name}</p>
                    <p class="item-data">${room.startDate}</p>
                </div>
                <hr class="item-line"/>
            </div>
        `)
        .join("");
}


// ----------執行程式----------

// 確認登入
onAuthStateChanged(auth,  async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    const rooms = await roomApi.getRoomList();
    showRoomList(rooms);    
    const name = await userApi.uidGetName(user.uid);
    userName.innerText = name;
    const level = await userApi.uidGetLevel(user.uid);
    userLevel.innerText = `Lv. ${level}`;
});


// ----------事件監聽----------

// 點擊開啟edit-modal
editBtn.addEventListener("click", function(){
    editModal.open();
})

// 點擊關閉edit-modal
editModal.root.addEventListener("click", function (e) {
    if (e.target === editModal.root) {
        editModal.close();
    }
});

// 點擊開啟create-modal
editModal.createBtn.addEventListener("click", function(){
   createModal.open();
})

// 點擊關閉create-modal
createModal.root.addEventListener("click", function (e) {
    if (e.target === createModal.root) {
        createModal.close();
        editModal.close();
        createModal.hint.classList.add("hidden");
    }
});

// 點擊執行新增副本動作
createModal.createBtn.addEventListener("click", async function(){
    const name = createModal.questName.value.trim();
    const desc = createModal.questDesc.value.trim();
    const date = createModal.questDate.value;

    const userUid = auth.currentUser.uid;
    if(name === "" || desc === ""){
        createModal.hint.classList.remove("hidden");
        return 0;
    }
    await roomApi.createRoom(name, desc, date, userUid);
    createModal.close();
    editModal.close();
    createModal.hint.classList.add("hidden");
    const rooms = await roomApi.getRoomList();
    showRoomList(rooms);

    createModal.questName.value = "";
    createModal.questDesc.value = "";
    createModal.questDate.value = "2007-08-21";
})

// 點擊開啟join-modal
editModal.joinBtn.addEventListener("click", function(){
   joinModal.open();
})

// 點擊關閉join-modal
joinModal.root.addEventListener("click", function (e) {
    if (e.target === joinModal.root) {
        let hint = joinModal.hint;
        const questCode = joinModal.questCode;
        joinModal.close();
        editModal.close();
        questCode.value = "";
        joinModal.hint.innerText = "";
    }
});

// 點擊進入副本頁面
itemArea.addEventListener("click", async function (e) {
    const item = e.target.closest(".item");
    if (!item) return;
    const roomId = item.dataset.id;
    const status = await roomApi.getStatus(roomId);
    if (status === "prepare"){
        window.location.href = `room_prepare.html?id=${roomId}`;
    }
    else if (status === "process"){
        window.location.href = `room_process.html?id=${roomId}`;
    }
    else if (status === "finish"){
        window.location.href = `room_finish.html?id=${roomId}`;
    }
});

// 點擊執行申請加入副本動作
joinModal.joinBtn.addEventListener("click", async function() {
    let hint = joinModal.hint;
    const questCode = joinModal.questCode;
    let code = questCode.value;
    const userUid = auth.currentUser.uid;
    let result = await roomApi.joinRoom(code, userUid);
    if (!result){
        hint.innerText = "此副本Code不存在";
    }
    else if (result === 1){
        hint.innerText = "此副本您已加入 不可重複申請";
    }
    else {
        hint.innerText = "申請成功 請等待隊長回應";
    }
});

