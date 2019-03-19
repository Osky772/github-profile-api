const getUserInput = document.querySelector("#gh-username");
const sendButton = document.querySelector("#send");
const findUserForm = document.querySelector("#find-user");
const repoList = document.querySelector("#repo__list");
const maxReposInput = document.querySelector("#gh-reposNum");

let userGhData = {};
let userGhRepos = [];
let reposToRender = [];
let languages;

async function getUserData(nick) {
	const user = await fetch(
		`https://api.github.com/users/${nick}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
	).then(res => res.json());

	const repos = await fetch(
		`${user["repos_url"]}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
	).then(res => res.json());
	const languageUrls = repos.map(repo => {
		return `${
			repo["languages_url"]
		}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`;
	});
	const requests = languageUrls.map(url => fetch(url));
	Promise.all(requests)
		.then(responses => responses.map(res => res))
		.then(responses => Promise.all(responses.map(r => r.json())))
		.then(value => {
			languages = value;
			console.log(languages);
		});
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
	userName.href = data["html_url"];
	userAvatar.src = data["avatar_url"];
	userFollowers.textContent = data.followers;
	userFollowLink.textContent = `Follow @${data.login}`;
	userFollowLink.href = data["html_url"];
};

const renderUserRepos = repos => {
	const maxRepos = Number(maxReposInput.value);
	reposToRender = repos.slice(0, maxRepos);

	const exisitingLinks = document.querySelectorAll(".repo-link");
	if (exisitingLinks.length !== 0) {
		exisitingLinks.forEach(el => el.remove());
	}

	reposToRender.forEach((repo, i) => {
		const repoLink = document.createElement("a");
		repoLink.classList.add("repo-link");
		repoLink.href = repo["html_url"];

		const updatedAt = moment(repo["updated_at"])
			.subtract(10, "days")
			.calendar();

		repoLink.innerHTML = `
            <span class="repo-name">${repo.name}</span>
            <span class="repo-update">Updated: ${updatedAt}</span>
            `;
		repoList.appendChild(repoLink);
	});
};

findUserForm.addEventListener("submit", function(e) {
	e.preventDefault();
	const userNickname = getUserInput.value;
	getUserData(userNickname);
});

maxReposInput.addEventListener("mouseup", function(e) {
	renderUserRepos(userGhRepos);
});
