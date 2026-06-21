import { auth, provider, signInWithPopup } from "./firebase.js";

const loginBtn = document.getElementById("login-btn");

loginBtn.addEventListener("click", async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        console.log("登入成功：", result.user);
        window.location.href = "page/main.html";

    } catch (err) {
        console.error("登入失敗：", err);
    }
});