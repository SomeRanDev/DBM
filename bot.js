require("ts-node").register({
	compilerOptions: {
		noImplicitAny: false,
	},
});

const botTs = require("node:path").join(__dirname, "bot.ts");
require(botTs);
