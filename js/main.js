import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as room from "./firebase_room.js";

const editBtn = document.getElementById("edit-btn");
const editModal = document.getElementById("edit-modal");
const createQuest = document.getElementById("create-quest");
const createModal = document.getElementById("create-modal");
const createQuestBtn = document.getElementById("create-quest-btn");
const itemArea = document.getElementById("item-area");
const joinQuest = document.getElementById("join-quest");
const joinModal = document.getElementById("join-modal");

function showRoomList(rooms) {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    itemArea.innerHTML = rooms
        .filter(room => room.owner === uid)
        .sort((a, b) => new Date(b.date) - new Date(a.date)) 
        .map(room => `
            <div class="item">
                <div class="item-container"> 
                    <p class="item-name">${room.name}</p>
                    <p class="item-data">${room.date}</p>
                </div>
                <hr class="item-line"/>
            </div>
        `)
        .join("");
}



onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "../index.html";
    }
});

const rooms = await room.getRooms();
showRoomList(rooms);    

editBtn.addEventListener("click", function(){
    editModal.classList.remove("hidden");
})

editModal.addEventListener("click", function (e) {
    if (e.target === editModal) {
        editModal.classList.add("hidden");
    }
});

createQuest.addEventListener("click", function(){
   createModal.classList.remove("hidden");
})

createModal.addEventListener("click", function (e) {
    if (e.target === createModal) {
        createModal.classList.add("hidden");
        editModal.classList.add("hidden");
    }
});

createQuestBtn.addEventListener("click", async function(){
    const nameInput = document.getElementById("create-quest-name");
    const descInput = document.getElementById("create-quest-description");
    const dateInput = document.getElementById("create-quest-date");
    const name = nameInput.value;
    const desc = descInput.value;
    const date = dateInput.value;

    const user = auth.currentUser.uid;

    await room.createRoom(name, desc, date, user);
    createModal.classList.add("hidden");
    editModal.classList.add("hidden");
    const rooms = await room.getRooms();
    showRoomList(rooms);

    nameInput.value = "";
    descInput.value = "";
    dateInput.value = "2007-08-21";
})

joinQuest.addEventListener("click", function(){
   joinModal.classList.remove("hidden");
})

joinModal.addEventListener("click", function (e) {
    if (e.target === joinModal) {
        joinModal.classList.add("hidden");
        editModal.classList.add("hidden");
    }
});

itemArea.addEventListener("click", function (e) {
    const item = e.target.closest(".item");
    if (!item) return;
    console.log("點到一個房間");
});