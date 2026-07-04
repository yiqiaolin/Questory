import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as room from "./firebase_room.js";
import * as user from "./firebase_user.js";


// 確認登入
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

// 透過網址取得當前的room id
const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");


// ----------物件取得----------
const memberArea = document.getElementById("member-area");
const questCode = document.getElementById("quest-code");


// ----------函式定義----------

// 取得副本資料並載入副本名和副本ID
async function loadRoom() {
    let roomData = await room.getRoomData(roomId);
    const questTitle = document.getElementById("quest-title");
    questTitle.textContent = roomData.name;
    questCode.textContent = roomData.id;
    loadMemberList(roomData.members);
}

// 載入副本成員列表  輸入:副本members欄位資料
async function loadMemberList(members){
    const memberArea = document.getElementById("member-area");

    const membersWithName = await Promise.all(
        members.map(async (member) => {
            const name = await user.uidGetName(member.uid);
            return {
                ...member,
                name
            };

        })
    );
    memberArea.innerHTML = membersWithName
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


// ----------執行程式----------
loadRoom();


// ----------事件監聽----------

// 點擊加入/移除按鈕變更資料庫內容並更新畫面
memberArea.addEventListener("click", async function (e){
    if (e.target.classList.contains("add-member-btn")) {
        const uid = e.target.dataset.id;
        await room.acceptMember(roomId, uid);
        const btnArea = e.target.closest(".member-btn-area");
        btnArea.classList.add("hidden");
    }

    if (e.target.classList.contains("delete-member-btn")) {
        const uid = e.target.dataset.id;
        await room.deleteMember(roomId, uid);
        loadRoom();
    }
});

// 點擊複製文字
questCode.addEventListener("click", async function() {
    const text = questCode.textContent;
    await navigator.clipboard.writeText(text);
});