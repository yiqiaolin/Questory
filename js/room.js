import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as userApi from "./firebase_user.js";

// 透過網址取得當前的room id
const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");


// ----------物件取得----------
const ownerMemberArea = document.getElementById("owner-member-area");
const memberMemberArea = document.getElementById("member-member-area");
const questCode = document.getElementById("quest-code");
const descAreaP = document.querySelector("#desc-area p");
const bottomBtn = document.getElementById("bottom-btn");
const editBtn = document.getElementById("edit-btn");
const editModal = document.getElementById("edit-modal");


// ----------函式定義----------

// 取得副本資料並載入副本名和副本ID
async function loadRoom(isOwner) {
    let roomData = await roomApi.getRoomData(roomId);
    const questTitle = document.getElementById("quest-title");
    questTitle.textContent = roomData.name;
    questCode.textContent = roomData.id;
    loadMemberList(roomData.members, isOwner);
}

// 載入副本成員列表  輸入:副本members欄位資料 是否是擁有者
async function loadMemberList(members, isOwner){
    const memberArea = document.getElementById("member-area");

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
}

// 判斷當前使用者是否是副本擁有者  輸入:副本ID 使用者ID 輸出:是->true 否->false
async function isOwner(roomId, uid){
    const owner = await roomApi.getOwner(roomId);
    if (uid === owner){
        return true;
    }
    return false;
}

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
}


// ----------執行程式----------

// 確認登入
onAuthStateChanged(auth, async(user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }

    const result = await isOwner(roomId, user.uid);
    loadRoom(result);
    switchView(result);
    if(result){
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
memberMemberArea.addEventListener("click", async function (e){
    if (e.target.classList.contains("add-member-btn")) {
        const uid = e.target.dataset.id;
        await roomApi.acceptMember(roomId, uid);
        const btnArea = e.target.closest(".member-btn-area");
        btnArea.classList.add("hidden");
    }

    if (e.target.classList.contains("delete-member-btn")) {
        const uid = e.target.dataset.id;
        await roomApi.deleteMember(roomId, uid);
        loadRoom();
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

    }
    else{
        await roomApi.exitRoom(roomId, auth.currentUser.uid);
        window.location.href = "../page/main.html";
    }
})

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