import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as userApi from "./firebase_user.js";
import * as taskApi from "./firebase_task.js";
import * as taskProgressApi from "./firebase_task_progress.js";

// 透過網址取得當前的room id
const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");


// ----------常數/變數----------
let currentIsOwner;
let currentUserUid;


// ----------物件取得----------
const ownerBtn = document.getElementById("owner-btn");
const ownerModal = document.getElementById("owner-modal");
const taskContainer = document.getElementById("task-container");
const taskModal = document.getElementById("task-modal");
const taskModalBtn = document.getElementById("task-modal-btn");
const todoContainer = document.getElementById("todo-container");


// ----------函式定義----------

// 取得副本資料並載入副本名
async function loadRoom(isOwner) {
    let roomData = await roomApi.getRoomData(roomId);
    const questTitle = document.getElementById("quest-title");
    questTitle.textContent = roomData.name;
    loadTaskList(roomData.tasks);
    loadTodoList()
};

// 載入副本任務列表  輸入:副本tasks欄位資料
async function loadTaskList(tasks){
    const progress = await taskProgressApi.getTaskProgress(currentUserUid, roomId);
    const acceptedTaskIds = progress.map(item => item.taskId);
    const availableTasks = tasks.filter(taskId => !acceptedTaskIds.includes(taskId));

    const tasksWithNameAndType = await Promise.all(
        availableTasks.map(async (taskId) => {
            const name = await taskApi.idGetName(taskId);
            const type = await taskApi.idGetType(taskId);
            return [taskId, name, type];
        })
    );
    taskContainer.innerHTML = tasksWithNameAndType.map(task => `
        <div class="task-item" data-id="${task[0]}">
            <div class="task-item-text">
                <p class="task-item-name">${task[1]}</p>
                <p class="task-item-type">${task[2]}</p>
            </div>
            <hr>
        </div>
    `)
    .join("");    
}

// 載入副本待辦列表
async function loadTodoList(){
    const todoDoc = await taskProgressApi.getTaskProgress(currentUserUid, roomId);    
    let todoData = todoDoc.map((doc)=>{
        if (doc.status === "in_progress"){
            doc.status = "進行中";
        }
        else if (doc.status === "submitted"){
            doc.status = "已提交";
        }
        else if (doc.status === "completed"){
            doc.status = "已完成";
        }
        else if (doc.status === "failed"){
            doc.status = "任務失敗";
        }

        return [doc.taskName, doc.status]
    });
    todoContainer.innerHTML = todoData.map(todo => `
        <div class="todo-item">
            <div class="todo-item-text">
                <p  class="todo-item-name">${todo[0]}</p>
                <p class="todo-item-state">${todo[1]}</p>
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

    currentUserUid = user.uid;
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

// 點擊開啟task_modal並載入對應資料
taskContainer.addEventListener("click", async function (e) {
    const item = e.target.closest(".task-item");
    if (!item) return;
    const taskId = item.dataset.id;
    const taskData = await taskApi.getTaskData(taskId);
    taskModal.innerHTML = `
        <div id="task-modal-content" data-id="${taskData.id}">
            <div id="task-modal-top-block">
                <p id="task-modal-name">${taskData.name}</p>
                <p id="task-modal-type">${taskData.type}</p>
            </div>
            <div id="task-modal-desc-block">
                <p>任務描述</p>
                <hr/>
                <p>${taskData.description}</p>
            </div>
            <div id="task-modal-reward-block">
                <p>獎勵</p>
                <hr/>
                <p id="task-modal-exp">${taskData.reward} EXP</p>
            </div>
            <button class="task-modal-btn" data-id="${taskData.id}">接任務</button>
        </div>
    `
    taskModal.classList.remove("hidden");
});

// 點擊關閉task_modal
taskModal.addEventListener("click", function (e) {
    if (e.target === taskModal) {
        taskModal.classList.add("hidden");
    }
});

// 點擊接任務
taskModal.addEventListener("click", async function(e){

    if(e.target.classList.contains("task-modal-btn")){
        const taskId = e.target.dataset.id;
        await taskProgressApi.createTaskProgress(roomId, taskId, currentUserUid);
        loadTodoList()
        taskModal.classList.add("hidden");
    }
});