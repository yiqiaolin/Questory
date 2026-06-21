const editBtn = document.getElementById("edit-btn");
const editModal = document.getElementById("edit-modal");
const createQuest = document.getElementById("create-quest");
const createModal = document.getElementById("create-modal");

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