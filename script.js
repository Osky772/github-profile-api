const getUserInput = document.querySelector("#gh-username");
const sendButton = document.querySelector("#send");
const ghUserNameForm = document.querySelector("#find-user");
const repoList = document.querySelector("#repo__list");
const maxReposInput = document.querySelector("#gh-reposNum");
const languagesList = document.querySelector("#profile__languages");

let userGhData = {};
let userGhRepos = [];
let reposToRender = [];
let topLanguages;

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
			let languages = value;

			const uniqueLangs = [
				...new Set(
					languages
						.map(repo => Object.keys(repo))
						.reduce((acc, next) => acc.concat(next), [])
				)
			];

			const eachLangSize = uniqueLangs.map(lang => {
				return languages
					.filter(repo => repo[lang] !== undefined)
					.reduce((acc, next) => acc + next[lang], 0);
			});

			const result = eachLangSize
				.reduce((result, size, index) => {
					result.push({
						name: uniqueLangs[index],
						size
					});
					return result;
				}, [])
				.sort((a, b) => b.size - a.size)
				.slice(0, 3);
			topLanguages = result;
			createLanguagesList(topLanguages);
		});
	userGhData = user;
	userGhRepos = repos;

	fillUserHeader(userGhData);
	sortReposByUpdate(userGhRepos);
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

const createLanguagesList = languages => {
	const existingLi = document.querySelectorAll("#profile__languages li");
	existingLi.length !== 0 ? existingLi.forEach(li => li.remove()) : null;
	languages.forEach(lang => {
		const li = document.createElement("li");
		li.textContent = lang.name;
		languagesList.appendChild(li);
	});
};

const renderUserRepos = userGhRepos => {
	const maxRepos = Number(maxReposInput.value);
	reposToRender = userGhRepos.slice(0, maxRepos);

	const exisitingLinks = document.querySelectorAll(".repo-link");
	if (exisitingLinks.length !== 0) {
		exisitingLinks.forEach(el => el.remove());
	}

	reposToRender.forEach((repo, i) => {
		const repoLink = document.createElement("a");
		repoLink.classList.add("repo-link");
		repoLink.href = repo["html_url"];

		const updatedAt = moment(repo["updated_at"]).calendar("sameDay");

		repoLink.innerHTML = `
            <span class="repo-name">${repo.name}</span>
            <span class="repo-update">Updated: ${updatedAt}</span>
            <span class="repo-starred">${
							repo.stargazers_count
						} <i class="fas fa-star"></i></span>
            `;
		repoList.appendChild(repoLink);
	});
};

const sortReposByUpdate = repos => {
	return repos.sort((a, b) => {
		return new Date(b["updated_at"]) * 1 - new Date(a["updated_at"]) * 1;
	});
};

ghUserNameForm.addEventListener("submit", function(e) {
	e.preventDefault();
	const userNickname = getUserInput.value;
	getUserData(userNickname);
});

maxReposInput.addEventListener("mouseup", function(e) {
	renderUserRepos(userGhRepos);
});
