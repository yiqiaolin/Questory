import { storage } from "./firebase.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from 
"https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";


export async function uploadTaskImage(file){

    console.log(
        "開始上傳:",
        file.name
    );


    const imageRef = ref(
        storage,
        `task-images/${Date.now()}-${file.name}`
    );


    await uploadBytes(
        imageRef,
        file
    );


    const url = await getDownloadURL(
        imageRef
    );


    return url;
}

/*
export async function uploadTaskImage(file){

    console.log(
        "開始上傳:",
        file.name
    );


    // 模擬上傳時間
    await new Promise(resolve=>{
        setTimeout(resolve,1000);
    });


    const imageUrl =
    "../assets/test-image.png";


    return imageUrl;
} */