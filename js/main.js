import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as userApi from "./firebase_user.js";

// ----------物件取得----------
const editBtn = document.getElementById("edit-btn");
const editModal = document.getElementById("edit-modal");
const createQuest = document.getElementById("create-quest");
const createModal = document.getElementById("create-modal");
const createQuestBtn = document.getElementById("create-quest-btn");
const itemArea = document.getElementById("item-area");
const joinQuest = document.getElementById("join-quest");
const joinModal = document.getElementById("join-modal");
const joinQuestBtn = document.getElementById("join-quest-btn");
const userName = document.getElementById("user-name");
const userLevel = document.getElementById("user-level");


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
                    <p class="item-data">${room.date}</p>
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

// 點擊開啟編輯modal
editBtn.addEventListener("click", function(){
    editModal.classList.remove("hidden");
})

// 點擊關閉編輯modal
editModal.addEventListener("click", function (e) {
    if (e.target === editModal) {
        editModal.classList.add("hidden");
    }
});

// 點擊開啟新增副本modal
createQuest.addEventListener("click", function(){
   createModal.classList.remove("hidden");
})

// 點擊關閉新增副本modal
createModal.addEventListener("click", function (e) {
    if (e.target === createModal) {
        createModal.classList.add("hidden");
        editModal.classList.add("hidden");
    }
});

// 點擊執行新增副本動作
createQuestBtn.addEventListener("click", async function(){
    const nameInput = document.getElementById("create-quest-name");
    const descInput = document.getElementById("create-quest-description");
    const dateInput = document.getElementById("create-quest-date");
    const name = nameInput.value;
    const desc = descInput.value;
    const date = dateInput.value;

    const userUid = auth.currentUser.uid;

    await roomApi.createRoom(name, desc, date, userUid);
    createModal.classList.add("hidden");
    editModal.classList.add("hidden");
    const rooms = await roomApi.getRoomList();
    showRoomList(rooms);

    nameInput.value = "";
    descInput.value = "";
    dateInput.value = "2007-08-21";
})

// 點擊開啟加入副本modal
joinQuest.addEventListener("click", function(){
   joinModal.classList.remove("hidden");
})

// 點擊關閉加入副本modal
joinModal.addEventListener("click", function (e) {
    if (e.target === joinModal) {
        let hint = document.getElementById("hint");
        const codeId = document.getElementById("code-id");
        let code = codeId.value;
        joinModal.classList.add("hidden");
        editModal.classList.add("hidden");
        codeId.value = "";
        hint.innerText = "";
    }
});

// 點擊進入副本頁面
itemArea.addEventListener("click", function (e) {
    const item = e.target.closest(".item");
    if (!item) return;
    const roomId = item.dataset.id;
    window.location.href = `room_prepare.html?id=${roomId}`;
});

// 點擊執行申請加入副本動作
joinQuestBtn.addEventListener("click", async function() {
    let hint = document.getElementById("hint");
    const codeId = document.getElementById("code-id");
    let code = codeId.value;
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

