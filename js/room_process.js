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

const rankImages = [
    "../assets/first-rank.png",
    "../assets/second-rank.png",
    "../assets/third-rank.png"
];


// ----------物件取得----------

// main
const ownerBtn = document.getElementById("owner-btn");
const totalValue = document.getElementById("total-value");
const questTitle = document.getElementById("quest-title");
const taskContainer = document.getElementById("task-container");
const todoContainer = document.getElementById("todo-container");
const rankingContainer = document.getElementById("ranking-container");
const rewardValue = document.getElementById("reward-value");

const ownerModal = (() => {
    const root = document.getElementById("owner-modal");
    return {
        root,
        addTaskBtn: root.querySelector(".add-task-btn"),
        verifyTaskBtn: root.querySelector(".verify-task-btn"),
        finishBtn: root.querySelector(".finish-btn"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();

const taskModal = (() => {
    const root = document.getElementById("task-modal");
    return {
        root,
        content: root.querySelector(".center-modal-content"),
        acceptBtn: root.querySelector(".accept-btn"),
        taskName: root.querySelector(".task-name"),
        taskType: root.querySelector(".task-type"),
        taskDesc: root.querySelector(".task-desc"),
        taskExp: root.querySelector(".task-exp"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();

const todoModal = (() => {
    const root = document.getElementById("todo-modal");
    return {
        root,
        taskName: root.querySelector(".task-name"),
        taskType: root.querySelector(".task-type"),
        taskDesc: root.querySelector(".task-desc"),
        submitBtn: root.querySelector(".submit-btn"),
        uploadText: root.querySelector(".upload-text"),
        previewImage: root.querySelector(".preview-image"),
        proofImageInput: document.getElementById("proof-image-input"),
        submittedPanelProofImage: root.querySelector(".submitted-panel .proof-image"),
        completedPanelProofImage: root.querySelector(".completed-panel .proof-image"),
        completedPanelRewardValue: root.querySelector(".completed-panel .reward-value"),
        failedPanelProofImage: root.querySelector(".failed-panel .proof-image"),
        failedPanelResubmitBtn: root.querySelector(".failed-panel .resubmit-btn"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();

const addTaskModal = (() => {
    const root = document.getElementById("add-task-modal");
    return {
        root,
        hint: root.querySelector(".hint"),
        taskName: root.querySelector(".task-name"),
        taskDesc: root.querySelector(".task-desc"),
        mainTaskBtn: root.querySelector(".main-task-btn"),
        sideTaskBtn: root.querySelector(".side-task-btn"),
        rewardValues: root.querySelector(".reward-values"),
        addBtn: root.querySelector(".add-btn"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();

const verifyTaskModal = (() => {
    const root = document.getElementById("verify-task-modal");
    return {
        root,
        itemsArea: root.querySelector(".items-area"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();

const verifyTaskItemModal = (() => {
    const root = document.getElementById("verify-task-item-modal");
    return {
        root,
        userName: root.querySelector(".user-name"),
        taskName: root.querySelector(".task-name"),
        taskDesc: root.querySelector(".task-desc"),
        proofImage: root.querySelector(".proof-image"),
        verifyBtn: root.querySelector(".verify-btn"),
        refuseBtn: root.querySelector(".refuse-btn"),

        open(){ 
            root.classList.remove("hidden"); 
        },
        close(){ 
            root.classList.add("hidden"); 
        },
    };
})();


// ----------函式定義----------

// 確認狀態
async function checkStatus(){

    const roomData = await roomApi.getRoomData(roomId);

    if (!roomData){
        location.href = "main.html";
        return;
    }
    if (roomData.status !== "process"){
        location.href = "main.html";
        return;
    }
}

// 取得副本資料並載入副本名
async function loadRoom(isOwner) {
    let roomData = await roomApi.getRoomData(roomId);
    questTitle.textContent = roomData.name;
    totalValue.textContent = roomData.total;
    rewardValue.innerText = `EXP  + ${roomData.members_reward[currentUserUid]}`;
    loadTaskList(roomData.tasks);
    loadTodoList();
    loadRankings(roomId);
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
            type = translate(type);
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

// 翻譯  輸入:要轉換的詞 輸出:狀態名稱
function translate(word){
    if (word === "in_progress"){
        return "進行中";
    }
    else if (word === "submitted"){
        return "已提交";
    }
    else if (word === "completed"){
        return "已完成";
    }
    else if (word === "failed"){
        return "任務失敗";
    }
    else if (word === "main"){
        return "主線";
    }
    else if (word === "side"){
        return "支線";
    }
}

// 載入副本待辦列表
async function loadTodoList(){
    const todoDoc = await taskProgressApi.getTaskProgress(currentUserUid, roomId);    
    let todoData = todoDoc.map((doc)=>{
        status = translate(doc.status);

        return [doc.taskName, status, doc.id]
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
    addTaskModal.rewardValues.innerText = `${exp} EXP`
};

// 恢復add-task-modal
function resetAddTaskModal(){
    addTaskModal.taskName.value = "";
    addTaskModal.taskDesc.value = "";
    exp = 0;
    addTaskModal.mainTaskBtn.classList.remove("selected");
    addTaskModal.sideTaskBtn.classList.remove("selected");
    addTaskModal.rewardValues.innerText = "EXP"
};

// 載入verify-task-modal列表
async function loadVerifyTaskModalList(){
    const TaskData = await taskProgressApi.getSubmittedProgress(roomId);    
    verifyTaskModal.itemsArea.innerHTML = TaskData.map(task => `
        <div class="task-item" data-id="${task.id}">
            <div>
                <p>${task.userName}</p>
                <p>${task.taskName}</p>
            </div>
            <hr/>
        </div>
    `)
    .join("");  
}

// 切換todo-modal視角  輸入:任務狀態
function switchTodoModalView(status){
    const inProgressPanel = document.querySelectorAll(".in_progress-panel");
    const submittedPanel = document.querySelectorAll(".submitted-panel");
    const completedPanel = document.querySelectorAll(".completed-panel");
    const failedPanel = document.querySelectorAll(".failed-panel");
    if(status === "in_progress"){
        inProgressPanel.forEach(element => {
            element.classList.remove("hidden");
        });
        submittedPanel.forEach(element => {
            element.classList.add("hidden");
        });
        completedPanel.forEach(element => {
            element.classList.add("hidden");
        });
        failedPanel.forEach(element => {
            element.classList.add("hidden");
        });
    }
    else if(status === "submitted"){
        inProgressPanel.forEach(element => {
            element.classList.add("hidden");
        }); 
        submittedPanel.forEach(element => {
            element.classList.remove("hidden");
        });
        completedPanel.forEach(element => {
            element.classList.add("hidden");
        });
        failedPanel.forEach(element => {
            element.classList.add("hidden");
        });
    }
    else if(status === "completed"){
        inProgressPanel.forEach(element => {
            element.classList.add("hidden");
        }); 
        submittedPanel.forEach(element => {
            element.classList.add("hidden");
        });
        completedPanel.forEach(element => {
            element.classList.remove("hidden");
        });
        failedPanel.forEach(element => {
            element.classList.add("hidden");
        });
    }
    else if(status === "failed"){
        inProgressPanel.forEach(element => {
            element.classList.add("hidden");
        }); 
        submittedPanel.forEach(element => {
            element.classList.add("hidden");
        });
        completedPanel.forEach(element => {
            element.classList.add("hidden");
        });
        failedPanel.forEach(element => {
            element.classList.remove("hidden");
        });
    }
};

async function loadRankings(roomId){

    const top3 = await roomApi.getRankings(roomId);

    if (!top3 || top3.length === 0){
        rankingContainer.innerHTML = "";
        return;
    }

    const names = await Promise.all(
        top3.map(rank => userApi.uidGetName(rank[0]))
    );

    rankingContainer.innerHTML = top3.map((rank, index) => {
        const uid = rank[0];
        const exp = rank[1];
        return `
            <div class="ranking-item">
                <img src="${rankImages[index]}">
                <div>
                    <p>${names[index]}</p>
                    <p>${exp} EXP</p>
                </div>
            </div>
        `;
    }).join("");
}


// ----------執行程式----------

// 確認狀態
checkStatus();

// 確認登入
onAuthStateChanged(auth,  async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    currentUserUid = user.uid;
    currentIsOwner = await isOwner(roomId, currentUserUid);
    loadRoom(currentIsOwner);
    switchView(currentIsOwner);
});


// ----------事件監聽----------

// 點擊開啟owner-modal
ownerBtn.addEventListener("click", function(){
    ownerModal.open();
})

// 點擊關閉owner-modal
ownerModal.root.addEventListener("click", function (e) {
    if (e.target === ownerModal.root) {
        ownerModal.close();
    }
});

// 點擊開啟task-modal並載入對應資料
taskContainer.addEventListener("click", async function (e) {
    const item = e.target.closest(".task-item");
    if (!item) return;
    const taskId = item.dataset.id;
    const taskData = await taskApi.getTaskData(taskId);
    taskModal.content.dataset.id = taskData.id;
    taskModal.taskName.innerText = taskData.name;
    taskModal.taskType.innerText = taskData.type;
    taskModal.taskDesc.innerText = taskData.description;
    taskModal.taskExp.innerText = taskData.reward;
    taskModal.acceptBtn.dataset.id = taskData.id;
    taskModal.open();
});

// 點擊關閉task-modal
taskModal.root.addEventListener("click", function (e) {
    if (e.target === taskModal.root) {
        taskModal.close();
    }
});

// 點擊接任務
taskModal.root.addEventListener("click", async function(e){

    if(e.target.classList.contains("accept-btn")){
        const taskId = e.target.dataset.id;
        await taskProgressApi.createTaskProgress(roomId, taskId, currentUserUid);
        loadRoom(currentIsOwner);
        taskModal.close();
    }
});

// 點擊開啟todo-modal並載入對應資料
todoContainer.addEventListener("click", async function (e) {
    const item = e.target.closest(".todo-item");
    if (!item) return;
    const progressId = item.dataset.id;
    const progressData = await taskProgressApi.getTaskProgressData(progressId);
    const taskId = progressData.taskId;
    const taskData = await taskApi.getTaskData(taskId);
    switchTodoModalView(progressData.status);
    const type = translate(taskData.type);
    todoModal.taskName.innerText = taskData.name;
    todoModal.taskType.innerText = type;
    todoModal.taskDesc.innerText = taskData.description;
    todoModal.submitBtn.dataset.id = taskId
    todoModal.submittedPanelProofImage.src = progressData.proofImages[0];
    todoModal.completedPanelProofImage.src = progressData.proofImages[0];
    todoModal.completedPanelRewardValue.innerText = `${taskData.reward}  EXP`
    todoModal.failedPanelProofImage.src = progressData.proofImages[0];
    todoModal.failedPanelResubmitBtn.dataset.id = progressData.id;
    todoModal.open();
});

// 點擊關閉todo-modal
todoModal.root.addEventListener("click", function (e) {
    if (e.target === todoModal.root) {
        todoModal.close();
    }
});

// 點擊上傳照片並顯示
todoModal.proofImageInput.addEventListener("change", function(){
    const file = this.files[0];
    const url = URL.createObjectURL(file);
    
    todoModal.previewImage.src = url;
    todoModal.previewImage.style.display="block";
    todoModal.uploadText.style.display="none";
});

// 點擊提交圖片
todoModal.submitBtn.addEventListener("click", async function(){
    const file = todoModal.proofImageInput.files[0];
    if(!file){
        alert("請選擇照片");
        return;
    }
    const taskId = this.dataset.id;
    const imageUrl = await storageApi.uploadTaskImage(file);
    todoModal.close();
    todoModal.proofImageInput.value = "";      
    todoModal.previewImage.style.display="";        
    todoModal.uploadText.style.display = "";
    await taskProgressApi.addProofImage(roomId, taskId, currentUserUid, imageUrl);
    const progressId = `${roomId}_${taskId}_${currentUserUid}`;
    await taskProgressApi.changeStatus(progressId, "submitted");
    loadTodoList();
});

// 點擊開啟add-task-modal
ownerModal.addTaskBtn.addEventListener("click", function(){
    addTaskModal.open();
    ownerModal.close();
})

// 點擊關閉add-task-modal
addTaskModal.root.addEventListener("click", function (e) {
    if (e.target === addTaskModal.root) {
        addTaskModal.close();
        addTaskModal.hint.classList.add("hidden");
        resetAddTaskModal();
    }
});

// 點擊選擇任務類型為主線並更新獎勵數值
addTaskModal.mainTaskBtn.addEventListener("click", function(){
    addTaskModal.mainTaskBtn.classList.add("selected");
    addTaskModal.sideTaskBtn.classList.remove("selected");
    createTaskType = "main";
    exp = baseExp * 1.5;
    showRewardValues(exp);
});

// 點擊選擇任務類型為支線並更新獎勵數值
addTaskModal.sideTaskBtn.addEventListener("click", function(){
    addTaskModal.sideTaskBtn.classList.add("selected");
    addTaskModal.mainTaskBtn.classList.remove("selected");
    createTaskType = "side";
    exp = baseExp * 1.2;
    showRewardValues(exp);
});

// 點擊新增任務
addTaskModal.addBtn.addEventListener("click", async function(){
    let name = addTaskModal.taskName.value.trim();
    let desc = addTaskModal.taskDesc.value.trim();
    if(name === "" || desc === "" || exp === 0){
        addTaskModal.hint.classList.remove("hidden");
        return 0;
    }
    const taskId = await taskApi.createTask(name, createTaskType, exp, desc);
    await roomApi.addTaskToRoom(roomId, taskId);
    addTaskModal.close();
    addTaskModal.hint.classList.add("hidden");
    resetAddTaskModal();
    loadRoom(currentIsOwner);
});

// 點擊開啟verify-task-modal
ownerModal.verifyTaskBtn.addEventListener("click", function(){
    loadVerifyTaskModalList()
    verifyTaskModal.open();
    ownerModal.close();
})

// 點擊關閉verify-task-modal
verifyTaskModal.root.addEventListener("click", function (e) {
    if (e.target === verifyTaskModal.root) {
        verifyTaskModal.close();
    }
});

// 點擊開啟verify-task-item-modal並載入對應資料
verifyTaskModal.itemsArea.addEventListener("click", async function (e) {
    const item = e.target.closest(".task-item");
    if (!item) return;
    const progressId = item.dataset.id;
    const progressData = await taskProgressApi.getTaskProgressData(progressId);
    const taskData = await taskApi.getTaskData(progressData.taskId)

    verifyTaskItemModal.userName.innerText = progressData.userName;
    verifyTaskItemModal.taskName.innerText = progressData.taskName;
    verifyTaskItemModal.taskDesc.innerText = taskData.description;
    verifyTaskItemModal.proofImage.src = progressData.proofImages[0];
    verifyTaskItemModal.verifyBtn.dataset.id = progressData.id;
    verifyTaskItemModal.refuseBtn.dataset.id = progressData.id;
    verifyTaskItemModal.open();
    verifyTaskModal.close();
});

// 點擊關閉verify-task-modal
verifyTaskItemModal.root.addEventListener("click", function (e) {
    if (e.target === verifyTaskItemModal.root) {
        verifyTaskItemModal.close();
    }
});

// 點擊認證任務
verifyTaskItemModal.verifyBtn.addEventListener("click", async function () {
    const progressId = this.dataset.id;
    await taskProgressApi.changeStatus(progressId, "completed");
    const progressData = await taskProgressApi.getTaskProgressData(progressId)
    const uid = progressData.uid;
    const taskId = progressData.taskId;
    const taskData = await taskApi.getTaskData(taskId);
    const exp = taskData.reward;
    await roomApi.addExpValues(roomId, uid, exp);
    await roomApi.addTotalValues(roomId)
     loadRoom(currentIsOwner);
    verifyTaskItemModal.close();
});

// 點擊拒絕任務
verifyTaskItemModal.refuseBtn.addEventListener("click", async function () {
    const progressId = this.dataset.id;
    await taskProgressApi.changeStatus(progressId, "failed");
    loadTodoList();
    verifyTaskItemModal.close();
});

// 點擊重新提交
todoModal.failedPanelResubmitBtn.addEventListener("click", async function () {
    const progressId = this.dataset.id;
    await taskProgressApi.changeStatus(progressId, "in_progress");
    await taskProgressApi.clearProofImages(progressId);
    loadTodoList();
    todoModal.close();
});

// 點擊結束副本
ownerModal.finishBtn.addEventListener("click", async function () {
    await roomApi.ProcessToFinish(roomId);
    const date = new Date();
    await roomApi.addEndDate(roomId, date);
    window.location.href = `room_finish.html?id=${roomId}`;
});