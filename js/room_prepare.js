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
let createTaskType = "";
const baseExp = 100;
let exp = 0;
let currentIsOwner;


// ----------物件取得----------

// main
const ownerMemberArea = document.getElementById("owner-member-area");
const memberMemberArea = document.getElementById("member-member-area");
const questCode = document.getElementById("quest-code");
const descAreaP = document.querySelector("#desc-area p");
const bottomBtn = document.getElementById("bottom-btn");
const editBtn = document.getElementById("edit-btn");
const taskDesc = document.getElementById("task-desc");
const taskArea = document.getElementById("task-area");
const questTitle = document.getElementById("quest-title");

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

// ----------函式定義----------

// 確認狀態
checkStatus();

// 確認狀態
async function checkStatus(){

    const roomData = await roomApi.getRoomData(roomId);

    if (!roomData){
        location.href = "main.html";
        return;
    }
    if (roomData.status !== "prepare"){
        location.href = "main.html";
        return;
    }
}

// 取得副本資料並載入副本名和副本ID
async function loadRoom(isOwner) {
    let roomData = await roomApi.getRoomData(roomId);
    questTitle.textContent = roomData.name;
    questCode.textContent = roomData.id;
    loadMemberList(roomData.members, isOwner);
    loadTaskList(roomData.tasks);
};

// 載入副本成員列表  輸入:副本members欄位資料 是否是擁有者
async function loadMemberList(members, isOwner){
    const membersWithName = await Promise.all(
        members.map(async (member) => {
            const name = await userApi.uidGetName(member.uid);
            return {
                ...member,
                name
            };

        })
    );

    if(isOwner){
        ownerMemberArea.innerHTML = membersWithName
        .map(member => `
            <div class="member-item">
                <div class="member-item-container"> 
                    <p class="member-item-name">${member.name}</p>
                    ${
                        member.status === "pending"
                            ? `
                                <div class="member-btn-area">
                                    <button class="add-member-btn" data-id="${member.uid}">加入</button>
                                    <button class="delete-member-btn" data-id="${member.uid}">移除</button>
                                </div>
                            `
                            : `
                                <div class="member-btn-area hidden">
                                    <button class="add-member-btn" data-id="${member.uid}">加入</button>
                                    <button class="delete-member-btn" data-id="${member.uid}">移除</button>
                                </div>
                            `
                    }
                </div>
                <hr/>
            </div>
        `)
        .join("");
    }
    else{
        memberMemberArea.innerHTML = membersWithName
        .filter(member =>member.status === "accepted")
        .map(member => `
            <div class="member-item">
                <div class="member-item-container"> 
                    <p class="member-item-name">${member.name}</p>
                </div>
                <hr/>
            </div>
        `)
        .join("");
    }
};

// 載入副本任務列表  輸入:副本tasks欄位資料
async function loadTaskList(tasks){
    const tasksWithName = await Promise.all(
        tasks.map(async (task) => {
            const name = await taskApi.idGetName(task);
            return name;
        })
    );
    taskArea.innerHTML = tasksWithName.map(task => `
        <div class="task-item">
            <p class="task-item-name">${task}</p>
            <hr/>
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
    const ownerPanel = document.querySelectorAll(".owner-panel");
    const memberPanel = document.querySelectorAll(".member-panel");
    if(isOwner){
        ownerPanel.forEach(element => {
            element.classList.remove("hidden");
        });
        memberPanel.forEach(element => {
            element.classList.add("hidden");
        });
    }
    else{
       ownerPanel.forEach(element => {
            element.classList.add("hidden");
        }); 
        memberPanel.forEach(element => {
            element.classList.remove("hidden");
        });
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


// ----------執行程式----------

// 確認登入
onAuthStateChanged(auth, async(user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    currentIsOwner = await isOwner(roomId, user.uid);
    loadRoom(currentIsOwner);
    switchView(currentIsOwner);
    if(currentIsOwner){
        bottomBtn.innerText = "開始副本";
    }
    else{
        const desc = await roomApi.getDesc(roomId);
        descAreaP.innerText = desc;
        bottomBtn.innerText = "退出副本";
    }
});


// ----------事件監聽----------

// 點擊加入/移除按鈕變更資料庫內容並更新畫面
ownerMemberArea.addEventListener("click", async function (e){
    if (e.target.classList.contains("add-member-btn")) {
        const uid = e.target.dataset.id;
        await roomApi.acceptMember(roomId, uid);
        await roomApi.addMembersRewardItem(roomId, uid);
        const btnArea = e.target.closest(".member-btn-area");
        btnArea.classList.add("hidden");
    }

    if (e.target.classList.contains("delete-member-btn")) {
        const uid = e.target.dataset.id;
        await roomApi.deleteMember(roomId, uid);
        loadRoom(currentIsOwner);
    }
});

// 點擊複製文字
questCode.addEventListener("click", async function() {
    const text = questCode.textContent;
    await navigator.clipboard.writeText(text);
});

// 點擊底部按鈕做出對應動作並變更畫面
bottomBtn.addEventListener("click", async function() {
    const result = await isOwner(roomId, auth.currentUser.uid);
    if(result){
        await roomApi.PrepareToProcess(roomId);
        window.location.href = `room_process.html?id=${roomId}`;
    }
    else{
        await roomApi.exitRoom(roomId, auth.currentUser.uid);
        await roomApi. deleteMembersRewardItem(roomId, auth.currentUser.uid)
        window.location.href = "../page/main.html";
    }
})

// 點擊開啟add-task-modal
editBtn.addEventListener("click", function(){
    addTaskModal.open();
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