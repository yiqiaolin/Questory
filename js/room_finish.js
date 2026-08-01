import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as taskProgressApi from "./firebase_task_progress.js";
import * as userApi from "./firebase_user.js";
import * as taskApi from "./firebase_task.js";


// 透過網址取得當前的room id
const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");

// ----------常數/變數----------
let currentUserUid;


// ----------物件取得----------

// main
const fixedBlock = (() => {
    const root = document.getElementById("fixed-block");
    return {
        root,
        questName: root.querySelector(".quest-name"),
        questDate: root.querySelector(".quest-date")
    };
})();

const summaryBlock = (() => {
    const root = document.getElementById("summary-block");
    return {
        root,
        memberValue: root.querySelector(".member-value"),
        taskValue: root.querySelector(".task-value"),
        rightArea: root.querySelector(".right-area")
    };
})();

const logBlock = (() => {
    const root = document.getElementById("log-block");
    return {
        root,
        container: root.querySelector(".container")
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
    if (roomData.status !== "finish"){
        location.href = "main.html";
        return;
    }
}

// 取得副本資料並載入
async function loadRoom() {
    let roomData = await roomApi.getRoomData(roomId);
    fixedBlock.questName.innerText = roomData.name;
    summaryBlock.memberValue.innerText = ` ${roomData.members.length} 人`;
    summaryBlock.taskValue.innerText = ` ${roomData.total} 項`;
    loadMembersRanking(roomData);
    loadLogArea(roomData);
    loadDate(roomData);
};

// 載入成員總排行表  輸入:副本資料
async function loadMembersRanking(roomData) {
    const membersReward = roomData.members_reward;
    const rankingData = Object.entries(membersReward)
                    .sort((a, b) => b[1] - a[1]);

    const rankingDataWithName = await Promise.all(
        rankingData.map(async (data) => {
            const name = await userApi.uidGetName(data[0]);
            const taskValue = await taskProgressApi.getMemberCompletedTask(roomId, data[0]);
            return {
                uid: data[0],
                name: name,
                exp: data[1],
                taskValue: taskValue.length
            };
        } )
    );

    summaryBlock.rightArea.innerHTML = rankingDataWithName.map(data => `
        <div class="member-item">
            <p>${data.name}</p>
            <p>${data.taskValue} / ${roomData.tasks.length}</p>
            <p>${data.exp} EXP</p>
        </div>
    `)
    .join("");    
}

// 載入任務日誌區  輸入:副本資料
async function loadLogArea(roomData){
    const logData = await Promise.all(
        roomData.tasks.map(async (task) => {
            const taskData = await taskApi.getTaskData(task);
            const taskName = taskData.name;
            const taskDesc = taskData.description;
            const progressData = await taskProgressApi.getTaskCompletedData(roomId, task);

            return {
                taskName,
                taskDesc,
                progressData
            };
        } )
    );

    logBlock.container.innerHTML = logData.map(data => `
        <div class="item">
            <p class="task-name">${data.taskName}</p>
            <hr/>
            <p class="task-desc">${data.taskDesc}</p>
            <div class="image-area">
                ${
                    data.progressData.map(progress => `
                        <div class="image-item">
                            <p>${progress.userName}</p>
                            <img src="${progress.proofImages}">
                        </div>
                    `).join("")
                }
            </div>
        </div>
    `)
    .join(""); 
}

// 載入副本日期區段
async function loadDate(roomData){
    let startDate = roomData.startDate.replaceAll("-", " / ");
    let endDate = roomData.endDate.toDate();
    endDate = `${endDate.getFullYear().toString()} / ${endDate.getMonth()+1} / ${endDate.getDate()}`;
    fixedBlock.questDate.innerText = `${startDate}   -   ${endDate}`;
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
    loadRoom();
});


// ----------事件監聽----------