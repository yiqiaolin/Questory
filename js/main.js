import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as room from "./firebase_room.js";


// 確認登入
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

// ----------物件取得----------
const editBtn = document.getElementById("edit-btn");
const editModal = document.getElementById("edit-modal");
const createQuest = document.getElementById("create-quest");
const createModal = document.getElementById("create-modal");
const createQuestBtn = document.getElementById("create-quest-btn");
const itemArea = document.getElementById("item-area");
const joinQuest = document.getElementById("join-quest");
const joinModal = document.getElementById("join-modal");


// ----------函式定義----------

// 顯示副本列表  輸入:資料庫rooms集合內所有文件
function showRoomList(rooms) {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    itemArea.innerHTML = rooms
        .filter(room => room.owner === uid)
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
const rooms = await room.getRoomList();
showRoomList(rooms);    


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

    await room.createRoom(name, desc, date, userUid);
    createModal.classList.add("hidden");
    editModal.classList.add("hidden");
    const rooms = await room.getRoomList();
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
        joinModal.classList.add("hidden");
        editModal.classList.add("hidden");
    }
});

// 點擊進入副本頁面
itemArea.addEventListener("click", function (e) {
    const item = e.target.closest(".item");
    if (!item) return;
    const roomId = item.dataset.id;
    window.location.href = `room.html?id=${roomId}`;
});