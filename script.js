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

let userGhData = {};
let userGhRepos = [];
let reposToRender = [];
let topLanguages;
let errorMsg = {};

async function getUserData(nick) {
	await fetch(
		`https://api.github.com/users/${nick}?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}` // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
	)
		.then(res => {
			if (!res.ok) {
				const start = moment();
				const end = moment(
					new Date(res.headers.get("X-RateLimit-Reset") * 1000)
				);
				const timeToComeBack = end.from(start, true);
				res.json().then(error => {
					const msg = error.message;
					const end = msg.indexOf("(");
					errorMsg["message"] = msg.slice(0, end);
					errorMsg["remain"] = timeToComeBack;
				});
			} else {
				return res.json();
			}
		})
		.then(user => {
			userGhData = user;
			fillUserHeader(userGhData);
		});

	const repos = await fetch(
		`${userGhData["repos_url"]}` // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
	).then(res => res.json());
	const languageUrls = repos.map(repo => {
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
			topLanguages = result;
			createLanguagesList(topLanguages);
		});
	userGhRepos = repos;

	fillUserHeader(userGhData);
	sortRepos(userGhRepos);
	renderUserRepos(userGhRepos);
}

async function getUserRepos(nick) {}

const fillUserHeader = data => {
	const profile = document.querySelector("#profile");
	const userName = document.querySelector("#profile__name");
	const userAvatar = document.querySelector("#profile__avatar img");
	const userFollowers = document.querySelector("#profile__followers");
	const userFollowLink = document.querySelector("#profile__follow a");
	if (userGhData !== undefined) {
		userName.textContent = data.name;
		userName.href = data["html_url"];
		userAvatar.src = data["avatar_url"];
		userFollowers.textContent = data.followers;
		userFollowLink.textContent = `Follow @${data.login}`;
		userFollowLink.href = data["html_url"];
	} else {
		Array.from(profile.children).forEach(element => {
			element.style.display = "none";
		});
		profile.innerHTML = `
		<div class="error">
			<p>${errorMsg.message}</p>
			<p class="remain">Come back in ${errorMsg.remain}</p>
		</div>
		`;
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

inputLastUpdated.addEventListener("click", function(e) {
	reposHeader.textContent = "Last updated repositiories";
	labelLastUpdated.classList.add("selected");
	labelMostStarred.classList.remove("selected");
	inputMostStarred.value = "";
	e.target.value = "on";
	sortRepos(userGhRepos);
});

inputMostStarred.addEventListener("click", function(e) {
	reposHeader.textContent = "Most starred repositories";
	labelMostStarred.classList.add("selected");
	labelLastUpdated.classList.remove("selected");
	inputLastUpdated.value = "";
	e.target.value = "on";
	sortRepos(userGhRepos);
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
	const userNickname = getUserInput.value;
	getUserData(userNickname);
	getUserRepos(userNickname);
});

maxReposInput.addEventListener("mouseup", function(e) {
	renderUserRepos(userGhRepos);
});
