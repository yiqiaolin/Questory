import { auth } from "./firebase.js";
import { onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import * as roomApi from "./firebase_room.js";
import * as userApi from "./firebase_user.js";

// ----------物件取得----------
const ownerBtn = document.getElementById("owner-btn");
const ownerModal = document.getElementById("owner-modal");


// ----------函式定義----------


// ----------執行程式----------

// 確認登入
onAuthStateChanged(auth,  async (user) => {
    if (!user) {
        window.location.href = "../index.html";
        return;
    }
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