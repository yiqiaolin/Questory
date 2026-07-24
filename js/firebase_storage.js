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
}