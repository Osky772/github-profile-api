const getUserInput = document.querySelector("#gh-username");
const sendButton = document.querySelector("#send");
const findUserForm = document.querySelector("#find-user");

let userGhData = {};

async function getUserData(nick) {
	const response = await fetch(`https://api.github.com/users/${nick}`);
	const data = await response.json();
	userGhData = data;
	fillUserHeader(userGhData);
}

const fillUserHeader = data => {
	const userName = document.querySelector("#profile__name");
	const userAvatar = document.querySelector("#profile__avatar img");
	userName.textContent = data.name;
	userAvatar.src = data["avatar_url"];

	console.log(data);
};

findUserForm.addEventListener("submit", function(e) {
	e.preventDefault();
	const userNickname = getUserInput.value;
	getUserData(userNickname);
});
