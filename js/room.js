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

const params = new URLSearchParams(window.location.search);
const roomId = params.get("id");
const memberArea = document.getElementById("member-area");
const questCode = document.getElementById("quest-code");

async function loadRoom() {
    let roomData = await room.getRoomData(roomId);
    const questTitle = document.getElementById("quest-title");
    questTitle.textContent = roomData.name;
    questCode.textContent = roomData.id;
    loadMemberList(roomData.members);
}

function loadMemberList(members){
    const memberArea = document.getElementById("member-area");

    memberArea.innerHTML = members
        .map(member => `
            <div class="member-item">
                <div class="member-item-container"> 
                    <p class="member-item-name">${member.name}</p>
                    ${
                        member.status === "pending"
                            ? `
                                <div class="member-btn-area">
                                    <button class="add-member-btn" data-id="${member.name}">加入</button>
                                    <button class="delete-member-btn" data-id="${member.name}">移除</button>
                                </div>
                            `
                            : `
                                <div class="member-btn-area hidden">
                                    <button class="add-member-btn" data-id="${member.name}">加入</button>
                                    <button class="delete-member-btn" data-id="${member.name}">移除</button>
                                </div>
                            `
                    }
                </div>
                <hr/>
            </div>
        `)
        .join("");
}


loadRoom();

memberArea.addEventListener("click", async function (e){
    if (e.target.classList.contains("add-member-btn")) {
        const name = e.target.dataset.id;
        await room.acceptMember(roomId, name);
        const btnArea = e.target.closest(".member-btn-area");
        btnArea.classList.add("hidden");
    }

    if (e.target.classList.contains("delete-member-btn")) {
        const name = e.target.dataset.id;
        await room.deleteMember(roomId, name);
        loadRoom();
    }
});


questCode.addEventListener("click", async function() {
    const text = questCode.textContent;
    await navigator.clipboard.writeText(text);
});