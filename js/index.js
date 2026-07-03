import { auth, provider, signInWithPopup } from "./firebase.js";
import * as user from "./firebase_user.js";

// ----------物件取得----------
const loginBtn = document.getElementById("login-btn");


// ----------事件監聽----------

// 點擊登入
loginBtn.addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        await user.createUserIfNotExist(result.user);
        console.log("登入成功：", result.user);
        window.location.href = "page/main.html";

    } catch (err) {
        console.error("登入失敗：", err);
    }
});