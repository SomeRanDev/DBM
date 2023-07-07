require("ts-node").register({
	compilerOptions: {
		noImplicitAny: false,
		allowImportingTsExtensions: true,
	},
});

const botTs = require("node:path").join(__dirname, "bot.ts");
require(botTs);
