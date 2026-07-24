import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as userApi from "./firebase_user.js";
import * as taskApi from "./firebase_task.js";
import * as taskProgressApi from "./firebase_task_progress.js";
import * as storageApi from "./firebase_storage.js";


// 透過網址取得當前的room id
const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");


// ----------常數/變數----------
let createTaskType = "";
const baseExp = 100;
let exp = 0;
let currentIsOwner;
let currentUserUid;


// ----------物件取得----------

// main
const ownerBtn = document.getElementById("owner-btn");
const totalValue = document.getElementById("total-value");
const questTitle = document.getElementById("quest-title");
const taskContainer = document.getElementById("task-container");

// owner modal
const ownerModal = document.getElementById("owner-modal");
const addTask = document.getElementById("add-task");
const checkMemberTask = document.getElementById("check-member-task");

// task modal
const taskModal = document.getElementById("task-modal");
const taskModalBtn = document.getElementById("task-modal-btn");
const taskModalName = document.getElementById("task-modal-name");
const taskModalType = document.getElementById("task-modal-type");
const taskModalDesc = document.getElementById("task-modal-desc");
const taskModalExp = document.getElementById("task-modal-exp");
const taskModalContent = document.getElementById("task-modal-content");

// todo modal
const todoContainer = document.getElementById("todo-container");
const proofImageInput = document.getElementById("proof-image-input");
const previewImage = document.getElementById("preview-image");
const uploadText = document.getElementById("upload-text");
const todoModalBtn = document.getElementById("todo-modal-btn");
const todoModal = document.getElementById("todo-modal");
const todoModalName = document.getElementById("todo-modal-name");
const todoModalType = document.getElementById("todo-modal-type");
const todoModalDesc = document.getElementById("todo-modal-desc");

// add task modal
const addTaskModal = document.getElementById("add-task-modal");
const addTaskModalAddTaskHint = document.getElementById("add-task-modal-add-task-hint");
const taskName = document.getElementById("task-name");
const addTaskModalTaskDesc = document.getElementById("add-task-modal-task-desc");
const mainTaskBtn = document.getElementById("main-task-btn");
const sideTaskBtn = document.getElementById("side-task-btn");
const addTaskModalRewardValues = document.getElementById("add-task-modal-reward-values");
const addTaskModalAddBtn = document.getElementById("add-task-modal-add-btn");

// verify task modal
const verifyTaskModal = document.getElementById("verify-task-modal");
const verifyTaskItemsArea = document.getElementById("verify-task-items-area");


// ----------函式定義----------

// 取得副本資料並載入副本名
async function loadRoom(isOwner) {
    let roomData = await roomApi.getRoomData(roomId);
    questTitle.textContent = roomData.name;
    totalValue.textContent = roomData.total;
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
            let type = await taskApi.idGetType(taskId);
            if (type === "main"){
                type = "主線";
            }
            else if (type === "side"){
                type = "支線";
            }
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

        return [doc.taskName, doc.status, doc.taskId]
    });
    todoContainer.innerHTML = todoData.map(todo => `
        <div class="todo-item" data-id="${todo[2]}">
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

// 切換頁面視角  輸入:是否是擁有者
async function switchView(isOwner){
    if(isOwner){
        ownerBtn.classList.remove("hidden");
    }
    else{
        ownerBtn.classList.add("hidden");
    }
};

// 顯示獎勵值  輸入:當前經驗值
function showRewardValues(exp){
    addTaskModalRewardValues.innerText = `${exp} EXP`
};

// 恢復add-task-modal
function resetAddTaskModal(){
    taskName.value = "";
    addTaskModalTaskDesc.value = "";
    exp = 0;
    mainTaskBtn.classList.remove("selected");
    sideTaskBtn.classList.remove("selected");
    addTaskModalRewardValues.innerText = "EXP"
};

// 載入verify-task-modal列表
async function loadVerifyTaskModalList(){
    const TaskData = await taskProgressApi.getSubmittedProgress(roomId);    
    verifyTaskItemsArea.innerHTML = TaskData.map(task => `
        <div class="verify-task-item" data-id="${task.id}">
            <div>
                <p>${task.userName}</p>
                <p>${task.taskName}</p>
            </div>
            <hr/>
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

    currentUserUid = user.uid;
    currentIsOwner = await isOwner(roomId, user.uid);
    loadRoom(currentIsOwner);
    switchView(currentIsOwner);
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
    taskModalContent.dataset.id = taskData.id;
    taskModalName.innerText = taskData.name;
    taskModalType.innerText = taskData.type;
    taskModalDesc.innerText = taskData.description;
    taskModalExp.innerText = taskData.reward;
    taskModalBtn.dataset.id = taskData.id;
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

    if(e.target.id === "task-modal-btn"){
        const taskId = e.target.dataset.id;
        await taskProgressApi.createTaskProgress(roomId, taskId, currentUserUid);
        loadRoom(currentIsOwner);
        taskModal.classList.add("hidden");
    }
});

// 點擊開啟todo_modal並載入對應資料
todoContainer.addEventListener("click", async function (e) {
    const item = e.target.closest(".todo-item");
    if (!item) return;
    const taskId = item.dataset.id;
    const taskData = await taskApi.getTaskData(taskId);
    todoModalName.innerText = taskData.name;
    todoModalType.innerText = taskData.type;
    todoModalDesc.innerText = taskData.description;
    todoModalBtn.dataset.id = taskId
    todoModal.classList.remove("hidden");
});

// 點擊關閉todo_modal
todoModal.addEventListener("click", function (e) {
    if (e.target === todoModal) {
        todoModal.classList.add("hidden");
    }
});

// 點擊上傳照片並顯示
proofImageInput.addEventListener("change", function(){
    const file = this.files[0];
    const url = URL.createObjectURL(file);
    
    previewImage.src = url;
    previewImage.style.display="block";
    uploadText.style.display="none";
});

// 點擊提交圖片
todoModalBtn.addEventListener("click", async function(){
    const file = proofImageInput.files[0];
    if(!file){
        alert("請選擇照片");
        return;
    }
    const taskId = this.dataset.id;
    const imageUrl = await storageApi.uploadTaskImage(file);
    todoModal.classList.add("hidden");
    proofImageInput.value = "";      
    previewImage.style.display="";        
    uploadText.style.display = "";
    await taskProgressApi.addProofImage(roomId, taskId, currentUserUid, imageUrl);
    await taskProgressApi.statusToSubmitted(roomId, taskId, currentUserUid);
    loadTodoList();
});

// 點擊開啟add-task-modal
addTask.addEventListener("click", function(){
    addTaskModal.classList.remove("hidden");
    ownerModal.classList.add("hidden");
})

// 點擊關閉add-task-modal
addTaskModal.addEventListener("click", function (e) {
    if (e.target === addTaskModal) {
        addTaskModal.classList.add("hidden");
        addTaskModalAddTaskHint.classList.add("hidden");
        resetAddTaskModal();
    }
});

// 點擊選擇任務類型為主線並更新獎勵數值
mainTaskBtn.addEventListener("click", function(){
    mainTaskBtn.classList.add("selected");
    sideTaskBtn.classList.remove("selected");
    createTaskType = "main";
    exp = baseExp * 1.5;
    showRewardValues(exp);
});

// 點擊選擇任務類型為支線並更新獎勵數值
sideTaskBtn.addEventListener("click", function(){
    sideTaskBtn.classList.add("selected");
    mainTaskBtn.classList.remove("selected");
    createTaskType = "side";
    exp = baseExp * 1.2;
    showRewardValues(exp);
});

// 點擊新增任務
addTaskModalAddBtn.addEventListener("click", async function(){
    let name = taskName.value.trim();
    let desc = addTaskModalTaskDesc.value.trim();
    if(name === "" || desc === "" || exp === 0){
        addTaskModalAddTaskHint.classList.remove("hidden");
        return 0;
    }
    const taskId = await taskApi.createTask(name, createTaskType, exp, desc);
    await roomApi.addTaskToRoom(roomId, taskId);
    addTaskModal.classList.add("hidden");
    addTaskModalAddTaskHint.classList.add("hidden");
    resetAddTaskModal();
    loadRoom(currentIsOwner);
});

// 點擊開啟verify-task-modal
checkMemberTask.addEventListener("click", function(){
    loadVerifyTaskModalList()
    verifyTaskModal.classList.remove("hidden");
    ownerModal.classList.add("hidden");
})

// 點擊關閉verify-task-modal
verifyTaskModal.addEventListener("click", function (e) {
    if (e.target === verifyTaskModal) {
        verifyTaskModal.classList.add("hidden");
    }
});