export let data = {
	user: null
};

async function getUserData(nick) {
	await fetch(
		`https://api.github.com/users/${nick}` // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
	)
		.then(res => {
			if (!res.ok) {
				const timeToComeBack = moment(
					new Date(res.headers.get("X-RateLimit-Reset") * 1000)
				).format("h:mm:ss");
				res.json().then(error => {
					const msg = error.message;
					const end = msg.indexOf("(");
					errorMsg["message"] = end !== -1 ? msg.slice(0, end) : msg.slice(0);
					errorMsg["remain"] = timeToComeBack;
				});
			} else {
				return res.json();
			}
		})
		.then(user => {
			removeErrorDiv();
			data.user = user;
			fillUserHeader(userGhData);
		});
}

async function getUserRepos(nick) {
	const repos = await fetch(
		`${data.user["repos_url"]}` // for 403 error add your ids: ?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}
	).then(res => res.json());
	data.repos = repos;
}

async function getReposLanguages(repos) {
	const eachRepoLanguages = repos.map(repo => {
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

	data.languages = topLanguages;
}
