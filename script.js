const getUserInput = document.querySelector("#gh-username");
const sendButton = document.querySelector("#send");
const ghUserNameForm = document.querySelector("#find-user");
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

let reposToRender = [];
let topLanguages;
let error = {};

async function getUserData(nick) {
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
					error.resetTime = resetTime;
				});
			} else if (res.status === 404) {
				error.message = "User not found.";
				error.isUserFound = false;
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
	console.log(gitHubUser.repos);
}

async function getGithubRepos() {
	if (error.message) {
		return;
	}

	gitHubUser.repos = await fetch(
		`${gitHubUser.data["repos_url"]}` // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
	).then(res => res.json());

	renderUserRepos(gitHubUser.repos);
}

async function getUserTopLanguages() {
	if (error.message) {
		return;
	}

	const eachRepoLanguages = gitHubUser.repos.map(repo => {
		return {
			[repo.language]: repo.size
		};
	});

	const uniqueLangs = [
		...new Set(
			eachRepoLanguages
				.map(repo => Object.keys(repo))
				.reduce((acc, next) => acc.concat(next), [])
				.filter(lang => lang !== "null")
		)
	];

	const eachLangSize = uniqueLangs.map(lang => {
		return eachRepoLanguages
			.filter(repo => repo[lang] !== undefined)
			.reduce((acc, next) => {
				return acc + next[lang];
			}, 0);
	});

	const topLanguages = eachLangSize
		.reduce((result, size, index) => {
			result.push({
				name: uniqueLangs[index],
				size
			});
			return result;
		}, [])
		.sort((a, b) => b.size - a.size)
		.slice(0, 3);

	gitHubUser.topLanguages = topLanguages;
	createLanguagesList(gitHubUser.topLanguages);
}

// const topLanguages = uniqueLangs
// 	.map(unique => {
// 		return eachRepoLanguages.filter(lang => lang === unique);
// 	})
// 	.sort((a, b) => b.length - a.length)
// 	.slice(0, 3);

// const languageUrls = repos.map(repo => {
// 	return `${repo["languages_url"]}`; // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
// });

// const requests = languageUrls.map(url => fetch(url));
// Promise.all(requests)
// 	.then(responses => responses.map(res => res))
// 	.then(responses => Promise.all(responses.map(r => r.json())))
// 	.then(value => {
// 		let languages = value;

// const uniqueLangs = [
// 	...new Set(
// 		languages
// 			.map(repo => Object.keys(repo))
// 			.reduce((acc, next) => acc.concat(next), [])
// 	)
// ];

// const eachLangSize = uniqueLangs.map(lang => {
// 	return languages
// 		.filter(repo => repo[lang] !== undefined)
// 		.reduce((acc, next) => acc + next[lang], 0);
// });

// const result = eachLangSize
// 	.reduce((result, size, index) => {
// 		result.push({
// 			name: uniqueLangs[index],
// 			size
// 		});
// 		return result;
// 	}, [])
// 	.sort((a, b) => b.size - a.size)
// 	.slice(0, 3);
// 		topLanguages = result;
// 	});

// 	createLanguagesList(topLanguages);
// 	sortRepos(gitHubUser.repos);
// 	renderUserRepos(gitHubUser.repos);
// }

const createErrorDiv = () => {
	const profile = document.querySelector("#profile");
	Array.from(profile.children).forEach(element => {
		element.classList.add("hide");
	});
	errorDiv.style.display = "flex";
	errorDiv.classList.add("error");
	errorDiv.classList.remove("hide");
	error.isUserFound
		? (errorDiv.innerHTML = `
		<p>${error.message}</p>
		<p class="remain">Come back at ${error.remain}</p>
	`)
		: (errorDiv.innerHTML = `<p>${error.message}</p>`);
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
	reposToRender = repos.slice(0, maxRepos);

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
		const sorted = repos.sort((a, b) => {
			return new Date(b["updated_at"]) * 1 - new Date(a["updated_at"]) * 1;
		});
		renderUserRepos(sorted);
	} else {
		const sorted = repos.sort((a, b) => {
			return (
				new Date(b["stargazers_count"]) * 1 -
				new Date(a["stargazers_count"]) * 1
			);
		});
		renderUserRepos(sorted);
	}
};

ghUserNameForm.addEventListener("submit", function(e) {
	e.preventDefault();
	Array.from(profile.children).forEach(element => {
		element.classList.remove("hide");
	});
	gitHubUser.data = {};
	gitHubUser.repos = {};
	reposToRender = [];
	topLanguages = null;
	error = {};
	const userNickname = getUserInput.value;
	removeErrorDiv();
	getUserData(userNickname);
});

maxReposInput.addEventListener("mouseup", function(e) {
	renderUserRepos(gitHubUser.repos);
});
