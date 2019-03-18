const getUserInput = document.querySelector("#gh-username");
const sendButton = document.querySelector("#send");
const findUserForm = document.querySelector("#find-user");

getUserInput.addEventListener("keyup", function(e) {
	console.log(e.target.value);
});

findUserForm.addEventListener("submit", function(e) {
	e.preventDefault();
});
