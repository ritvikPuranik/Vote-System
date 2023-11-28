const addCandidate = async() =>{
    console.log("clicked>>");
    var formEl = document.forms['candidate-details'];
    var formData = new FormData(formEl);
    let allData = Object.fromEntries(formData);
    console.log("allData>>", allData);
    await App.addCandidate(allData);
    window.location.href = "/";

}

document.getElementById("submit-new-candidate").addEventListener("click", (event)=>{
    event.preventDefault();
})