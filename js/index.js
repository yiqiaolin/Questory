var editBtn = document.getElementById("edit-btn");
var editModal = document.getElementById("edit-modal");

editBtn.addEventListener("click", function(){
    editModal.classList.remove("hidden");
})

editModal.addEventListener("click", function (e) {
    if (e.target === editModal) {
        editModal.classList.add("hidden");
    }
});