const fs = require('fs-extra');
const execSync = require('child_process').execSync;

// Electron Builder strip off certain important keys from package.json, which we need, in particular build.appId
// so this script is used to preserve the keys that we need.

const packageInfo = require(`${__dirname}/../package.json`);

module.exports = async function() {
	const removeKeys = ['scripts', 'devDependencies', 'optionalDependencies', 'dependencies'];

	for (let i = 0; i < removeKeys.length; i++) {
		delete packageInfo[removeKeys[i]];
	}

	const appId = packageInfo.build.appId;
	const productName = packageInfo.build.productName;

	delete packageInfo.build;

	packageInfo.build = { appId: appId };
	packageInfo.name = productName;

	let branch;
	let hash;
	try {
		// Use stdio: 'pipe' so that execSync doesn't print error directly to stdout
		branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).toString().trim();
		hash   = execSync('git log --pretty="%h" -1', { stdio: 'pipe' }).toString().trim();
		// The builds in CI are done from a 'detached HEAD' state
		if (branch === 'HEAD') branch = 'master';
	} catch (err) {
		// Don't display error object as it's a "fatal" error, but
		// not for us, since is it not critical information
		// https://github.com/laurent22/joplin/issues/2256
		console.info('Warning: Could not get git info (it will not be displayed in About dialog box)');
	}
	if (typeof branch !== 'undefined' && typeof hash !== 'undefined') {
		packageInfo.git = { branch: branch, hash: hash };
	}

	let fileContent = `// Auto-generated by compile-package-info.js\n// Do not change directly\nconst packageInfo = ${JSON.stringify(packageInfo, null, 4)};`;
	fileContent += '\n';
	fileContent += 'module.exports = packageInfo;';

	fs.writeFileSync(`${__dirname}/../packageInfo.js`, fileContent);

	return Promise.resolve();
};
