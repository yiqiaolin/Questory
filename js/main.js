import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as room from "./room.js";

const editBtn = document.getElementById("edit-btn");
const editModal = document.getElementById("edit-modal");
const createQuest = document.getElementById("create-quest");
const createModal = document.getElementById("create-modal");
const createQuestBtn = document.getElementById("create-quest-btn");
const itemArea = document.getElementById("item-area");

function showRoomList(rooms){
    itemArea.innerHTML = ``;
    rooms.forEach(room => {
        itemArea.innerHTML = itemArea.innerHTML + `
            <div class="item">
                <div class="item-container"> 
                    <p class="item-name">${room.name}</p>
                    <p class="item-data">${room.date}</p>
                </div>
                <hr class="item-line"/>
            </div>
        `;
    });
        
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
    const name = document.getElementById("create-quest-name").value;
    const desc = document.getElementById("create-quest-description").value;
    const date = document.getElementById("create-quest-date").value;
    room.createRoom(name, desc, date);
    createModal.classList.add("hidden");
    editModal.classList.add("hidden");
    const rooms = await room.getRooms();
    showRoomList(rooms);
})