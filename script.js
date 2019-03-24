const getUserInput = document.querySelector("#gh-username");
const sendButton = document.querySelector("#send");
const ghUserNameForm = document.querySelector("#find-user");
const profile = document.querySelector("#profile");
const reposHeader = document.querySelector("#repos__header");
const repoList = document.querySelector("#repo__list");
const maxReposInput = document.querySelector("#gh-reposNum");
const languagesList = document.querySelector("#profile__languages");
const inputLastUpdated = document.querySelector("#last-updated");
const labelLastUpdated = document.querySelector("#label-last-updated");
const labelMostStarred = document.querySelector("#label-most-starred");
const inputMostStarred = document.querySelector("#most-starred");
const errorDiv = document.createElement("div");

let gitHubUser = {
	data: {},
	repos: [],
	topLanguages: []
};
let reposToRender;
let error = {};

async function fetchGitHubUserData(nick) {
	await fetch(
		`https://api.github.com/users/${nick}` // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
	)
		.then(res => {
			if (res.status === 403) {
				const resetTime = res.headers.get("X-RateLimit-Reset");

				res.json().then(err => {
					const end = err.message.indexOf("(");
					error.message =
						end !== -1 ? err.message.slice(0, end) : err.message.slice(0);
					error.resetTime = new Date(resetTime * 1000);
				});
			} else if (res.status === 404) {
				error.message = "User not found.";
				error.isWrongUser = true;
			} else {
				return res.json();
			}
		})
		.then(user => {
			removeErrorDiv();
			gitHubUser.data = user;
			fillUserHeader(gitHubUser.data);
		});
	await getGithubRepos();
	await getUserTopLanguages();
	profile.style.display = "block";
}

async function getGithubRepos() {
	if (!error.message && gitHubUser.data !== undefined) {
		gitHubUser.repos = await fetch(
			`${gitHubUser.data["repos_url"]}` // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
		).then(res => res.json());

		sortRepos(gitHubUser.repos);
	}
}

async function getUserTopLanguages() {
	if (error.message) {
		return;
	}

	const languageUrls = gitHubUser.repos.map(repo => {
		return `${repo["languages_url"]}`; // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
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

			gitHubUser.topLanguages = result;
			createLanguagesList(gitHubUser.topLanguages);
		});
}

const createErrorDiv = () => {
	Array.from(profile.children).forEach(element => {
		element.classList.add("hide");
	});
	errorDiv.style.display = "flex";
	errorDiv.classList.add("error");
	errorDiv.classList.remove("hide");

	if (error.resetTime) {
		let remainingTime = error.resetTime.getMinutes() - new Date().getMinutes();
		remainingTime = remainingTime < 0 ? 60 + remainingTime : remainingTime;
		errorDiv.innerHTML = `
		<p>${error.message}</p>
		<p class="remain">Come back after ${remainingTime} minutes.</p>
	`;
	} else if (error.isWrongUser) {
		errorDiv.innerHTML = `<p>${error.message}</p>`;
	}

	profile.append(errorDiv);
};

const removeErrorDiv = () => {
	Array.from(profile.children).forEach(element => {
		element.classList.remove("hide");
	});
	errorDiv.style.display = "none";
};

const fillUserHeader = data => {
	const userName = document.querySelector("#profile__name");
	const userAvatar = document.querySelector("#profile__avatar img");
	const userFollowers = document.querySelector("#profile__followers");
	const userFollowLink = document.querySelector("#profile__follow a");
	if (gitHubUser.data !== undefined) {
		userName.textContent = data.name;
		userName.href = data["html_url"];
		userAvatar.src = data["avatar_url"];
		userFollowers.textContent = data.followers;
		userFollowLink.textContent = `Follow @${data.login}`;
		userFollowLink.href = data["html_url"];
	} else {
		createErrorDiv();
	}
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

const renderUserRepos = repos => {
	const maxRepos = Number(maxReposInput.value);

	const exisitingLinks = document.querySelectorAll(".repo-link");
	if (exisitingLinks.length !== 0) {
		exisitingLinks.forEach(el => el.remove());
	}
	repos.forEach((repo, i) => {
		if (i < maxRepos) {
			const repoLink = document.createElement("a");
			repoLink.classList.add("repo-link");
			repoLink.href = repo["html_url"];

			const updatedAt = new Date(repo["updated_at"]).toLocaleDateString();

			repoLink.innerHTML = `
            <span class="repo-name">${repo.name}</span>
            <span class="repo-update">Updated: ${updatedAt}</span>
            <span class="repo-starred">${
							repo.stargazers_count
						} <i class="fas fa-star"></i></span>
            `;
			repoList.appendChild(repoLink);
		}
	});
};

inputLastUpdated.addEventListener("click", function(e) {
	reposHeader.textContent = "Last updated repositiories";
	labelLastUpdated.classList.add("selected");
	labelMostStarred.classList.remove("selected");
	inputMostStarred.value = "";
	e.target.value = "on";
	sortRepos(gitHubUser.repos);
});

inputMostStarred.addEventListener("click", function(e) {
	reposHeader.textContent = "Most starred repositories";
	labelMostStarred.classList.add("selected");
	labelLastUpdated.classList.remove("selected");
	inputLastUpdated.value = "";
	e.target.value = "on";
	sortRepos(gitHubUser.repos);
});

const sortRepos = repos => {
	if (inputLastUpdated.value === "on") {
		repos.sort((a, b) => {
			return (
				new Date(b["updated_at"]).getTime() -
				new Date(a["updated_at"]).getTime()
			);
		});
		renderUserRepos(repos);
	} else {
		repos.sort((a, b) => {
			return (
				new Date(b["stargazers_count"]) * 1 -
				new Date(a["stargazers_count"]) * 1
			);
		});
		renderUserRepos(repos);
	}
};

ghUserNameForm.addEventListener("submit", function(e) {
	e.preventDefault();
	gitHubUser.data = {};
	gitHubUser.repos = {};
	reposToRender = [];
	topLanguages = null;
	const userNickname = getUserInput.value;
	fetchGitHubUserData(userNickname);
});

maxReposInput.addEventListener("mouseup", function(e) {
	renderUserRepos(gitHubUser.repos);
});

window.addEventListener("load", e => {
	inputLastUpdated.value = "off";
	fetchGitHubUserData("osky772");
});
