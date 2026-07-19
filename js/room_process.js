import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as userApi from "./firebase_user.js";
import * as taskApi from "./firebase_task.js";

// 透過網址取得當前的room id
const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");


// ----------常數/變數----------
let currentIsOwner;


// ----------物件取得----------
const ownerBtn = document.getElementById("owner-btn");
const ownerModal = document.getElementById("owner-modal");
const taskContainer = document.getElementById("task-container");


// ----------函式定義----------

// 取得副本資料並載入副本名
async function loadRoom(isOwner) {
    let roomData = await roomApi.getRoomData(roomId);
    const questTitle = document.getElementById("quest-title");
    questTitle.textContent = roomData.name;
    loadTaskList(roomData.tasks);
};

// 載入副本任務列表  輸入:副本tasks欄位資料
async function loadTaskList(tasks){
    const tasksWithNameAndType = await Promise.all(
        tasks.map(async (taskId) => {
            const name = await taskApi.idGetName(taskId);
            const type = await taskApi.idGetType(taskId);
            return [name, type];
        })
    );
    taskContainer.innerHTML = tasksWithNameAndType.map(task => `
        <div class="task-item">
            <div class="task-item-text">
                <p class="task-item-name">${task[0]}</p>
                <p class="task-item-type">${task[1]}</p>
            </div>
            <hr>
        </div>
    `)
    .join("");    
}

// 判斷當前使用者是否是副本擁有者  輸入:副本ID 使用者ID 輸出:是->true 否->false
async function isOwner(roomId, uid){
    const owner = await roomApi.getOwner(roomId);
    if (uid === owner){
        return true;
    }
    return false;
};


// ----------執行程式----------

// 確認登入
onAuthStateChanged(auth,  async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    currentIsOwner = await isOwner(roomId, user.uid);
    loadRoom(currentIsOwner);
});


// ----------事件監聽----------

// 點擊開啟隊長modal
ownerBtn.addEventListener("click", function(){
    ownerModal.classList.remove("hidden");
})

// 點擊關閉隊長modal
ownerModal.addEventListener("click", function (e) {
    if (e.target === ownerModal) {
        ownerModal.classList.add("hidden");
    }
});