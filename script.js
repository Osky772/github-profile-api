const getUserInput = document.querySelector("#gh-username");
const sendButton = document.querySelector("#send");
const findUserForm = document.querySelector("#find-user");

let userGhData = {};
let userGhRepos = [];

async function getUserData(nick) {
	const user = await fetch(`https://api.github.com/users/${nick}`).then(res =>
		res.json()
	);
	const repos = await fetch(user["repos_url"]).then(res => res.json());
	userGhData = user;
	userGhRepos = repos;
	fillUserHeader(userGhData);
	renderUserRepos(userGhRepos);
}

const fillUserHeader = data => {
	const userName = document.querySelector("#profile__name");
	const userAvatar = document.querySelector("#profile__avatar img");
	const userFollowers = document.querySelector("#profile__followers");
	const userFollowLink = document.querySelector("#profile__follow a");

	userName.textContent = data.name;
	userAvatar.src = data["avatar_url"];
	userFollowers.textContent = data.followers;
	userFollowLink.textContent = `Follow @${data.login}`;
	userFollowLink.href = data["html_url"];

	console.log(data);
};

const renderUserRepos = repos => {
	const repoList = document.querySelector("#repo__list");

	repos.forEach(repo => {
		console.log(repo);
		const repoLink = document.createElement("a");
		repoLink.classList.add("repo-link");
		repoLink.href = repo["html_url"];
		const repoName = document.createElement("span");
		repoName.classList.add("repo-name");
		repoName.textContent = repo.name;
		repoLink.appendChild(repoName);

		repoList.appendChild(repoLink);
	});
};

findUserForm.addEventListener("submit", function(e) {
	e.preventDefault();
	const userNickname = getUserInput.value;
	getUserData(userNickname);
});
