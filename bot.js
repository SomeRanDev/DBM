/******************************************************
 * Discord Bot Maker Bot
 * Version 2.0.0
 * Robert Borghese
 ******************************************************/

const DBM = {};
DBM.version = "2.0.0";

const DiscordJS = (DBM.DiscordJS = require("discord.js"));

if (DiscordJS.version < "13.1.0") {
  console.log(
    'This version of Discord Bot Maker requires discord.JS v13.1.0.\nPlease use "Project > Module Manager" and "Project > Reinstall Node Modules" to update to discord.js v13.\n',
  );
  throw new Error("Need discord.js v13 to run!!!");
}

//---------------------------------------------------------------------
//#region Bot
// Contains functions for controlling the bot.
//---------------------------------------------------------------------

const Bot = (DBM.Bot = {});

Bot.$slash = {}; // Slash commands
Bot.$user = {}; // User commands
Bot.$msge = {}; // Message commands

Bot.$cmds = {}; // Normal commands
Bot.$icds = []; // Includes word commands
Bot.$regx = []; // Regular Expression commands
Bot.$anym = []; // Any message commands

Bot.$other = {}; // Manual commands

Bot.$evts = {}; // Events

Bot.bot = null;
Bot.applicationCommandData = [];

Bot.PRIVILEGED_INTENTS = DiscordJS.Intents.FLAGS.GUILD_MEMBERS | DiscordJS.Intents.FLAGS.GUILD_PRESENCES;

Bot.NON_PRIVILEGED_INTENTS =
  DiscordJS.Intents.FLAGS.GUILDS |
  DiscordJS.Intents.FLAGS.GUILD_BANS |
  DiscordJS.Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS |
  DiscordJS.Intents.FLAGS.GUILD_INTEGRATIONS |
  DiscordJS.Intents.FLAGS.GUILD_WEBHOOKS |
  DiscordJS.Intents.FLAGS.GUILD_INVITES |
  DiscordJS.Intents.FLAGS.GUILD_VOICE_STATES |
  DiscordJS.Intents.FLAGS.GUILD_MESSAGES |
  DiscordJS.Intents.FLAGS.GUILD_MESSAGE_REACTIONS |
  DiscordJS.Intents.FLAGS.GUILD_MESSAGE_TYPING |
  DiscordJS.Intents.FLAGS.DIRECT_MESSAGES |
  DiscordJS.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS |
  DiscordJS.Intents.FLAGS.DIRECT_MESSAGE_TYPING;

Bot.ALL_INTENTS = Bot.PRIVILEGED_INTENTS | Bot.NON_PRIVILEGED_INTENTS;

Bot.init = function () {
  this.initBot();
  this.setupBot();
  this.reformatData();
  this.initEvents();
  this.login();
};

Bot.initBot = function () {
  this.bot = new DiscordJS.Client({ intents: this.intents() });
};

Bot.intents = function () {
  return this.NON_PRIVILEGED_INTENTS;
};

Bot.setupBot = function () {
  this.bot.on("raw", this.onRawData);
};

Bot.onRawData = function (packet) {
  if (packet.t !== "MESSAGE_REACTION_ADD" || packet.t !== "MESSAGE_REACTION_REMOVE") return;

  const client = Bot.bot;
  const channel = client.channels.resolve(packet.d.channel_id);
  if (channel.messages.cache.has(packet.d.message_id)) return;

  channel.messages.fetch(packet.d.message_id).then(function (message) {
    const emoji = packet.d.emoji.id ? `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name;
    const reaction = message.reactions.resolve(emoji);
    if (packet.t === "MESSAGE_REACTION_ADD") {
      client.emit("messageReactionAdd", reaction, client.users.resolve(packet.d.user_id));
    }
    if (packet.t === "MESSAGE_REACTION_REMOVE") {
      client.emit("messageReactionRemove", reaction, client.users.resolve(packet.d.user_id));
    }
  });
};

Bot.reformatData = function () {
  this.reformatCommands();
  this.reformatEvents();
};

Bot.reformatCommands = function () {
  const data = Files.data.commands;
  if (!data) return;
  this._caseSensitive = Files.data.settings.case === "true";
  for (let i = 0; i < data.length; i++) {
    const com = data[i];
    if (com) {
      switch (com.comType) {
        case "0": {
          if (this._caseSensitive) {
            this.$cmds[com.name] = com;
            if (com._aliases) {
              const aliases = com._aliases;
              for (let j = 0; j < aliases.length; j++) {
                this.$cmds[aliases[j]] = com;
              }
            }
          } else {
            this.$cmds[com.name.toLowerCase()] = com;
            if (com._aliases) {
              const aliases = com._aliases;
              for (let j = 0; j < aliases.length; j++) {
                this.$cmds[aliases[j].toLowerCase()] = com;
              }
            }
          }
          break;
        }
        case "1": {
          this.$icds.push(com);
          break;
        }
        case "2": {
          this.$regx.push(com);
          break;
        }
        case "3": {
          this.$anym.push(com);
          break;
        }
        case "4": {
          const name = this.validateSlashCommandName(com.name);
          if (name) {
            if (this.$slash[name]) {
              console.error("Slash command with name \"" + name + "\" already exists!\nThis duplicate will be ignored.\n");
            } else {
              this.$slash[name] = com;
              this.applicationCommandData.push(this.createApiJsonFromCommand(com));
            }
          } else {
            console.error("Slash command has invalid name: \"" + name + "\".\nSlash command names cannot have spaces and must only contain letters, numbers, underscores, and dashes!\nThis command will be ignored.");
          }
          break;
        }
        case "5": {
          const name = com.name;
          if (this.$user[name]) {
            console.error("User command with name \"" + name + "\" already exists!\nThis duplicate will be ignored.\n");
          } else {
            this.$user[name] = com;
            this.applicationCommandData.push(this.createApiJsonFromCommand(com));
          }
          break;
        }
        case "6": {
          const name = com.name;
          if (this.$msge[name]) {
            console.error("Message command with name \"" + name + "\" already exists!\nThis duplicate will be ignored.\n");
          } else {
            this.$msge[name] = com;
            this.applicationCommandData.push(this.createApiJsonFromCommand(com));
          }
          break;
        }
        default: {
          this.$other[com._id] = com;
          break;
        }
      }
    }
  }
};

Bot.createApiJsonFromCommand = function (com, name) {
  const result = {
    name: name ?? com.name,
    description: this.generateSlashCommandDescription(com),
  };
  switch(com.comType) {
    case "4": { result.type = "CHAT_INPUT"; break; }
    case "5": { result.type = "USER"; break; }
    case "6": { result.type = "MESSAGE"; break; }
  }
  if (com.comType === "4" && com.parameters && Array.isArray(com.parameters)) {
    result.options = this.validateSlashCommandParameters(com.parameters, result.name);
  }
  return result;
};

Bot.validateSlashCommandName = function (name) {
  if (!name) {
    return false;
  }
  if (name.length > 32) {
    name = name.substring(0, 32);
  }
  if (name.match(/^[\w-]{1,32}$/)) {
    return name.toLowerCase();
  }
  return false;
};

Bot.generateSlashCommandDescription = function (com) {
  const desc = com.description;
  if (com.comType !== "4") {
    return "";
  }
  return this.validateSlashCommandDescription(desc);
};

Bot.validateSlashCommandDescription = function (desc) {
  if (desc.length > 100) {
    return desc.substring(0, 100);
  }
  return desc || "(no description)";
};

Bot.validateSlashCommandParameters = function (parameters, commandName) {
  const requireParams = [];
  const optionalParams = [];
  const existingNames = {};
  for (let i = 0; i < parameters.length; i++) {
    const paramsData = parameters[i];
    const name = this.validateSlashCommandName(paramsData.name);
    if (name) {
      if (!existingNames[name]) {
        existingNames[name] = true;
        paramsData.name = name;
        paramsData.description = this.validateSlashCommandDescription(paramsData.description);
        if (paramsData.required) {
          requireParams.push(paramsData);
        } else {
          optionalParams.push(paramsData);
        }
      } else {
        console.error("Slash command \"" + commandName + "\" parameter #" + (i + 1) + " (\"" + name + "\") has a name that's already being used!\nThis duplicate will be ignored.\n");
      }
    } else {
      console.error("Slash command \"" + commandName + "\" parameter #" + (i + 1) + " has invalid name: \"" + name + "\".\nSlash command parameter names cannot have spaces and must only contain letters, numbers, underscores, and dashes!\nThis parameter will be ignored.\n");
    }
  }
  return requireParams.concat(optionalParams);
};

Bot.reformatEvents = function () {
  const data = Files.data.events;
  if (!data) return;
  for (let i = 0; i < data.length; i++) {
    const com = data[i];
    if (com) {
      const type = com["event-type"];
      if (!this.$evts[type]) this.$evts[type] = [];
      this.$evts[type].push(com);
    }
  }
};

Bot.initEvents = function () {
  this.bot.on("ready", this.onReady.bind(this));
  this.bot.on("messageCreate", this.onMessage.bind(this));
  this.bot.on("interactionCreate", this.onInteraction.bind(this));
  Events.registerEvents(this.bot);
};

Bot.login = function () {
  this.bot.login(Files.data.settings.token);
};

Bot.onReady = function () {
  process.send?.("BotReady");
  console.log("Bot is ready!"); // Tells editor to start!
  this.restoreVariables();
  this.registerApplicationCommands();
  this.preformInitialization();
};

Bot.restoreVariables = function () {
  Files.restoreServerVariables();
  Files.restoreGlobalVariables();
};

Bot.registerApplicationCommands = function () {
  this.bot.guilds.cache.forEach((key, value) => {
    this.bot.guilds.fetch(key).then((guild) => {
      guild?.commands?.set(this.applicationCommandData);
    }).catch(function(e) {
      console.error(e);
    });
  });
};

Bot.preformInitialization = function () {
  const bot = this.bot;
  if (this.$evts["1"]) {
    Events.onInitialization(bot);
  }
  if (this.$evts["3"]) {
    Events.setupIntervals(bot);
  }
};

Bot.onMessage = function (msg) {
  if (msg.author.bot) return;

  try {
    if (!this.checkCommand(msg)) {
      this.onAnyMessage(msg);
    }
  } catch (e) {
    console.error(e);
  }
};

Bot.checkCommand = function (msg) {
  let command = this.checkTag(msg.content);
  if (!command) return false;
  if (!this._caseSensitive) {
    command = command.toLowerCase();
  }
  const cmd = this.$cmds[command];
  if (cmd) {
    Actions.preformActionsFromMessage(msg, cmd);
    return true;
  }
  return false;
};

Bot.checkTag = function (content) {
  const tag = Files.data.settings.tag;
  const separator = Files.data.settings.separator || "\\s+";
  content = content.split(new RegExp(separator))[0];
  if (content.startsWith(tag)) {
    return content.substring(tag.length);
  }
  return null;
};

Bot.onAnyMessage = function (msg) {
  this.checkIncludes(msg);
  this.checkRegExps(msg);
  if (!msg.author.bot) {
    if (this.$evts["2"]) {
      Events.callEvents("2", 1, 0, 2, false, "", msg);
    }
    const anym = this.$anym;
    for (let i = 0; i < anym.length; i++) {
      if (anym[i]) {
        Actions.preformActionsFromMessage(msg, anym[i]);
      }
    }
  }
};

Bot.checkIncludes = function (msg) {
  const text = msg.content;
  if (!text) return;
  const icds = this.$icds;
  const icds_len = icds.length;
  for (let i = 0; i < icds_len; i++) {
    if (icds[i] && icds[i].name) {
      if (text.match(new RegExp("\\b" + icds[i].name + "\\b", "i"))) {
        Actions.preformActionsFromMessage(msg, icds[i]);
      } else if (icds[i]._aliases) {
        const aliases = icds[i]._aliases;
        const aliases_len = aliases.length;
        for (let j = 0; j < aliases_len; j++) {
          if (text.match(new RegExp("\\b" + aliases[j] + "\\b", "i"))) {
            Actions.preformActionsFromMessage(msg, icds[i]);
            break;
          }
        }
      }
    }
  }
};

Bot.checkRegExps = function (msg) {
  const text = msg.content;
  if (!text) return;
  const regx = this.$regx;
  const regx_len = regx.length;
  for (let i = 0; i < regx_len; i++) {
    if (regx[i] && regx[i].name) {
      if (text.match(new RegExp(regx[i].name, "i"))) {
        Actions.preformActionsFromMessage(msg, regx[i]);
      } else if (regx[i]._aliases) {
        const aliases = regx[i]._aliases;
        const aliases_len = aliases.length;
        for (let j = 0; j < aliases_len; j++) {
          if (text.match(new RegExp("\\b" + aliases[j] + "\\b", "i"))) {
            Actions.preformActionsFromMessage(msg, regx[i]);
            break;
          }
        }
      }
    }
  }
};

Bot.onInteraction = function (interaction) {
  const interactionName = interaction.commandName;
  if (interaction.isCommand()) {
    if (this.$slash[interactionName]) {
      Actions.preformActionsFromInteraction(interaction, this.$slash[interactionName]);
    }
  } else if (interaction.isContextMenu()) {
    if (this.$user[interactionName]) {
      Actions.preformActionsFromInteraction(interaction, this.$user[interactionName]);
    } else if (this.$msge[interactionName]) {
      Actions.preformActionsFromInteraction(interaction, this.$msge[interactionName]);
    }
  }
};

//#endregion

//---------------------------------------------------------------------
//#region Actions
// Contains functions for bot actions.
//---------------------------------------------------------------------

const Actions = (DBM.Actions = {});

Actions.actionsLocation = null;
Actions.eventsLocation = null;
Actions.extensionsLocation = null;

Actions.server = {};
Actions.global = {};

Actions.timeStamps = [];

Actions.exists = function (action) {
  if (!action) return false;
  return typeof this[action] === "function";
};

Actions.getLocalFile = function (url) {
  return require("node:path").join(process.cwd(), url);
};

Actions.getDBM = function () {
  return DBM;
};

Actions.callListFunc = function (list, funcName, args) {
  return new Promise(function (resolve) {
    const max = list.length;
    let curr = 0;
    function callItem() {
      if (curr === max) {
        resolve.apply(this, arguments);
        return;
      }
      const item = list[curr++];
      if (typeof item?.funcName === "function") {
        item[funcName].apply(item, args).then(callItem).catch(callItem);
      } else {
        callItem();
      }
    }
    callItem();
  });
};

Actions.getActionVariable = function (name, defaultValue) {
  if (this[name] === undefined && defaultValue !== undefined) {
    this[name] = defaultValue;
  }
  return this[name];
};

Actions.eval = function (content, cache) {
  if (!content) return false;
  const DBM = this.getDBM();
  const tempVars = this.getActionVariable.bind(cache.temp);
  let serverVars = null;
  if (cache.server) {
    serverVars = this.getActionVariable.bind(this.server[cache.server.id]);
  }
  const globalVars = this.getActionVariable.bind(this.global);
  const msg = cache.msg;
  const server = cache.server;
  const client = DBM.Bot.bot;
  const bot = DBM.Bot.bot;
  const me = server?.me ?? null;
  let user = "",
    member = "",
    mentionedUser = "",
    mentionedChannel = "",
    defaultChannel = "";
  if (msg) {
    user = msg.author;
    member = msg.member;
    if (msg.mentions) {
      mentionedUser = msg.mentions.users.first() ?? "";
      mentionedChannel = msg.mentions.channels.first() ?? "";
    }
  }
  if (server) {
    defaultChannel = server.getDefaultChannel();
  }
  try {
    return eval(content);
  } catch (e) {
    console.error(e);
    return false;
  }
};

Actions.evalMessage = function (content, cache) {
  if (!content) return "";
  if (!content.match(/\$\{.*\}/im)) return content;
  return this.eval("`" + content.replace(/`/g, "\\`") + "`", cache);
};

Actions.initMods = function () {
  const fs = require("node:fs");
  this.modDirectories().forEach(
    function (dir) {
      fs.readdirSync(dir).forEach(
        function (file) {
          if (file.match(/\.js/i)) {
            const action = require(require("node:path").join(dir, file));
            if (action.action) {
              this[action.name] = action.action;
            }
            if (action.mod) {
              try {
                action.mod(DBM);
              } catch (e) {
                console.error(e);
              }
            }
          }
        }.bind(this),
      );
    }.bind(this),
  );
};

Actions.modDirectories = function () {
  const result = [this.actionsLocation];
  if (Files.verifyDirectory(Actions.eventsLocation)) {
    result.push(this.eventsLocation);
  }
  if (Files.verifyDirectory(Actions.extensionsLocation)) {
    result.push(this.extensionsLocation);
  }
  return result;
};

Actions.preformActionsFromMessage = function (msg, cmd) {
  if (this.checkConditions(msg.guild, msg.member, msg.author, cmd) && this.checkTimeRestriction(msg.author, cmd)) {
    this.invokeActions(msg, cmd.actions);
  }
};

Actions.preformActionsFromInteraction = function (interaction, cmd) {
  if (this.checkConditions(interaction.guild, interaction.member, interaction.user, cmd) && this.checkTimeRestriction(interaction.user, cmd)) {
    this.invokeInteraction(interaction, cmd.actions);
  }
};

Actions.checkConditions = function (guild, member, user, cmd) {
  const isServer = Boolean(guild && member);
  const restriction = parseInt(cmd.restriction, 10);
  switch (restriction) {
    case 0:
    case 1: {
      if (isServer) {
        return this.checkPermissions(member, cmd.permissions) && this.checkPermissions(member, cmd.permissions2);
      }
      return restriction === 0;
    }
    case 2:
      return isServer && guild.ownerId === member.id;
    case 3:
      return !isServer;
    case 4:
      return Files.data.settings.ownerId && user.id === Files.data.settings.ownerId;
    default:
      return true;
  }
};

Actions.checkTimeRestriction = function (user, cmd) {
  if (!cmd._timeRestriction) return true;
  if (!user) return false;
  const mid = user.id;
  const cid = cmd._id;
  if (!this.timeStamps[cid]) {
    this.timeStamps[cid] = [];
    this.timeStamps[cid][mid] = Date.now();
    return true;
  } else if (!this.timeStamps[cid][mid]) {
    this.timeStamps[cid][mid] = Date.now();
    return true;
  } else {
    const time = Date.now();
    const diff = time - this.timeStamps[cid][mid];
    if (cmd._timeRestriction <= Math.floor(diff / 1000)) {
      this.timeStamps[cid][mid] = time;
      return true;
    } else {
      const remaining = cmd._timeRestriction - Math.floor(diff / 1000);
      Events.callEvents("38", 1, 3, 2, false, "", msg.member, this.generateTimeString(remaining));
    }
  }
};

Actions.generateTimeString = function (milliseconds) {
  let remaining = milliseconds;
  const times = [];

  const days = Math.floor(remaining / 60 / 60 / 24);
  if (days > 0) {
    remaining -= days * 60 * 60 * 24;
    times.push(days + (days === 1 ? " day" : " days"));
  }
  const hours = Math.floor(remaining / 60 / 60);
  if (hours > 0) {
    remaining -= hours * 60 * 60;
    times.push(hours + (hours === 1 ? " hour" : " hours"));
  }
  const minutes = Math.floor(remaining / 60);
  if (minutes > 0) {
    remaining -= minutes * 60;
    times.push(minutes + (minutes === 1 ? " minute" : " minutes"));
  }
  const seconds = Math.floor(remaining);
  if (seconds > 0) {
    remaining -= seconds;
    times.push(seconds + (seconds === 1 ? " second" : " seconds"));
  }

  let result = "";
  if (times.length === 1) {
    result = times[0];
  } else if (times.length === 2) {
    result = times[0] + " and " + times[1];
  } else if (times.length === 3) {
    result = times[0] + ", " + times[1] + ", and " + times[2];
  } else if (times.length === 4) {
    result = times[0] + ", " + times[1] + ", " + times[2] + ", and " + times[3];
  }
  return result;
};

Actions.checkPermissions = function (member, permissions) {
  if (!permissions) return true;
  if (!member) return false;
  if (permissions === "NONE") return true;
  if (msg.guild.ownerId === member.id) return true;
  return member.permissions.has(permissions);
};

Actions.invokeActions = function (msg, actions) {
  if (actions.length > 0) {
    const cache = {
      actions: actions,
      index: -1,
      temp: {},
      server: msg.guild,
      msg: msg,
    };
    this.callNextAction(cache);
  }
};

Actions.invokeInteraction = function (interaction, actions) {
  if (actions.length > 0) {
    const cache = {
      actions: actions,
      index: -1,
      temp: {},
      server: interaction.guild,
      interaction: interaction,
    };
    this.callNextAction(cache);
  }
};

Actions.invokeEvent = function (event, server, temp) {
  const actions = event.actions;
  if (actions.length > 0) {
    const cache = {
      actions: actions,
      index: -1,
      temp: temp,
      server: server,
    };
    this.callNextAction(cache);
  }
};

Actions.callNextAction = function (cache) {
  cache.index++;
  const index = cache.index;
  const actions = cache.actions;
  const act = actions[index];
  if (!act) {
    if (cache.callback) {
      cache.callback();
    }
    if (cache.interaction) {
      if (!cache.interaction.replied) {
        cache.interaction.reply({
          ephemeral: true,
          content: "Command successfully run!",
        });
      }
    }
    return;
  }
  if (this.exists(act.name)) {
    try {
      this[act.name](cache);
    } catch (e) {
      this.displayError(act, cache, e);
    }
  } else {
    console.error(act.name + " does not exist!");
    this.callNextAction(cache);
  }
};

Actions.getErrorString = function (data, cache) {
  const type = "permissions" in data || "restriction" in data || !("event-type" in data) ? "command" : "event";
  return `Error with the ${type} "${data.name}", Action #${cache.index + 1}`;
};

Actions.displayError = function (data, cache, err) {
  const dbm = this.getErrorString(data, cache);
  console.error(dbm + ":\n" + err);
  Events.onError(dbm, err.stack ?? err, cache);
};

Actions.getSendTarget = function (type, varName, cache) {
  const msg = cache.msg;
  const interaction = cache.interaction;
  const server = cache.server;
  switch (type) {
    case 0:
      if (interaction) {
        return interaction.channel;
      } else if (msg) {
        return msg.channel;
      }
      break;
    case 1:
      if (interaction) {
        return interaction.user;
      } else if (msg) {
        return msg.author;
      }
      break;
    case 2: {
      const users = interaction?.options?.resolved?.users ?? msg?.mentions?.users;
      if (users?.size) {
        return users.first();
      }
      break;
    }
    case 3: {
      const channels = interaction?.options?.resolved?.channels ?? msg?.mentions?.channels;
      if (channels?.size) {
        return channels.first();
      }
      break;
    }
    case 4:
      if (server) {
        return server.getDefaultChannel();
      }
      break;
    case 5:
      return cache.temp[varName];
    case 6:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 7:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getMember = function (type, varName, cache) {
  const msg = cache.msg;
  const interaction = cache.interaction;
  const server = cache.server;
  switch (type) {
    case 0: {
      const members = interaction?.options?.resolved?.members ?? msg?.mentions?.members;
      if (members?.size) {
        return members.first();
      }
      break;
    }
    case 1:
      if (interaction) {
        return interaction.member ?? interaction.user;
      } else if (msg) {
        return msg.member ?? msg.author;
      }
      break;
    case 2:
      return cache.temp[varName];
    case 3:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 4:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getMessage = function (type, varName, cache) {
  const msg = cache.msg;
  const server = cache.server;
  switch (type) {
    case 0:
      if (msg) {
        return msg;
      }
      break;
    case 1:
      return cache.temp[varName];
    case 2:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 3:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getServer = function (type, varName, cache) {
  const server = cache.server;
  switch (type) {
    case 0:
      if (server) {
        return server;
      }
      break;
    case 1:
      return cache.temp[varName];
    case 2:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 3:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getRole = function (type, varName, cache) {
  const msg = cache.msg;
  const interaction = cache.interaction;
  const server = cache.server;
  switch (type) {
    case 0: {
      const roles = interaction?.options?.resolved?.roles ?? msg?.mentions?.roles;
      if (roles?.size) {
        return roles.first();
      }
      break;
    }
    case 1: {
      const member = interaction?.member ?? msg?.member;
      if (member?.roles?.cache?.size) {
        return msg.member.roles.cache.first();
      }
      break;
    }
    case 2:
      if (server?.roles?.cache?.size) {
        return server.roles.cache.first();
      }
      break;
    case 3:
      return cache.temp[varName];
    case 4:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 5:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getChannel = function (type, varName, cache) {
  const msg = cache.msg;
  const interaction = cache.interaction;
  const server = cache.server;
  switch (type) {
    case 0:
      if (interaction) {
        return interaction.channel;
      } else if (msg) {
        return msg.channel;
      }
      break;
    case 1: {
      const channels = interaction?.options?.resolved?.channels ?? msg?.mentions?.channels;
      if (channels?.size) {
        return channels.first();
      }
      break;
    }
    case 2:
      if (server) {
        return server.getDefaultChannel();
      }
      break;
    case 3:
      return cache.temp[varName];
    case 4:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 5:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getVoiceChannel = function (type, varName, cache) {
  const msg = cache.msg;
  const interaction = cache.interaction;
  const server = cache.server;
  switch (type) {
    case 0: {
      const member = interaction?.member ?? msg?.member;
      if (member) {
        return member.voice?.channel;
      }
      break;
    }
    case 1: {
      const members = interaction?.options?.resolved?.members ?? msg?.mentions?.members;
      if (members?.size) {
        const member = members.first();
        if (member) {
          return member.voice?.channel;
        }
      }
      break;
    }
    case 2:
      if (server) {
        return server.getDefaultVoiceChannel();
      }
      break;
    case 3:
      return cache.temp[varName];
    case 4:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 5:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getList = function (type, varName, cache) {
  const msg = cache.msg;
  const interaction = cache.interaction;
  const server = cache.server;
  switch (type) {
    case 0:
      if (server) {
        return [...server.members.cache.values()];
      }
      break;
    case 1:
      if (server) {
        return [...server.channels.cache.values()];
      }
      break;
    case 2:
      if (server) {
        return [...server.roles.cache.values()];
      }
      break;
    case 3:
      if (server) {
        return [...server.emojis.cache.values()];
      }
      break;
    case 4:
      return [...Bot.bot.guilds.cache.values()];
    case 5: {
      const members = interaction?.options?.resolved?.members ?? msg?.mentions?.members;
      if (members?.size) {
        return [...members.first().roles.cache.values()];
      }
      break;
    }
    case 6: {
      const member = interaction?.member ?? msg?.member;
      if (member) {
        return [...member.roles.cache.values()];
      }
      break;
    }
    case 7:
      return cache.temp[varName];
    case 8:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 9:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.getVariable = function (type, varName, cache) {
  const server = cache.server;
  switch (type) {
    case 1:
      return cache.temp[varName];
    case 2:
      if (server && this.server[server.id]) {
        return this.server[server.id][varName];
      }
      break;
    case 3:
      return this.global[varName];
    default:
      break;
  }
  return false;
};

Actions.storeValue = function (value, type, varName, cache) {
  const server = cache.server;
  switch (type) {
    case 1:
      cache.temp[varName] = value;
      break;
    case 2:
      if (server) {
        this.server[server.id] ??= {};
        this.server[server.id][varName] = value;
      }
      break;
    case 3:
      this.global[varName] = value;
      break;
    default:
      break;
  }
};

Actions.executeResults = function (result, data, cache) {
  if (result) {
    const type = parseInt(data.iftrue, 10);
    switch (type) {
      case 0:
        this.callNextAction(cache);
        break;
      case 2:
        const val = parseInt(this.evalMessage(data.iftrueVal, cache), 10);
        const index = Math.max(val - 1, 0);
        if (cache.actions[index]) {
          cache.index = index - 1;
          this.callNextAction(cache);
        }
        break;
      case 3:
        const amnt = parseInt(this.evalMessage(data.iftrueVal, cache), 10);
        const index2 = cache.index + amnt + 1;
        if (cache.actions[index2]) {
          cache.index = index2 - 1;
          this.callNextAction(cache);
        }
        break;
      default:
        break;
    }
  } else {
    const type = parseInt(data.iffalse, 10);
    switch (type) {
      case 0:
        this.callNextAction(cache);
        break;
      case 2:
        const val = parseInt(this.evalMessage(data.iffalseVal, cache), 10);
        const index = Math.max(val - 1, 0);
        if (cache.actions[index]) {
          cache.index = index - 1;
          this.callNextAction(cache);
        }
        break;
      case 3:
        const amnt = parseInt(this.evalMessage(data.iffalseVal, cache), 10);
        const index2 = cache.index + amnt + 1;
        if (cache.actions[index2]) {
          cache.index = index2 - 1;
          this.callNextAction(cache);
        }
        break;
      default:
        break;
    }
  }
};

//#endregion

//---------------------------------------------------------------------
//#region Events
// Handles the various events that occur.
//---------------------------------------------------------------------

const Events = (DBM.Events = {});

let $evts = null;

Events.data = [
  [],
  [],
  [],
  [],
  ["guildCreate", 0, 0, 1],
  ["guildDelete", 0, 0, 1],
  ["guildMemberAdd", 1, 0, 2],
  ["guildMemberRemove", 1, 0, 2],
  ["channelCreate", 1, 0, 2, true, "arg1.type !== 'GUILD_TEXT'"],
  ["channelDelete", 1, 0, 2, true, "arg1.type !== 'GUILD_TEXT'"],
  ["roleCreate", 1, 0, 2],
  ["roleDelete", 1, 0, 2],
  ["guildBanAdd", 3, 0, 1],
  ["guildBanRemove", 3, 0, 1],
  ["channelCreate", 1, 0, 2, true, "arg1.type !== 'GUILD_VOICE'"],
  ["channelDelete", 1, 0, 2, true, "arg1.type !== 'GUILD_VOICE'"],
  ["emojiCreate", 1, 0, 2],
  ["emojiDelete", 1, 0, 2],
  ["messageDelete", 1, 0, 2, true],
  ["guildUpdate", 1, 3, 3],
  ["guildMemberUpdate", 1, 3, 4],
  ["presenceUpdate", 1, 3, 4],
  ["voiceStateUpdate", 1, 3, 4],
  ["channelUpdate", 1, 3, 4, true],
  ["channelPinsUpdate", 1, 0, 2, true],
  ["roleUpdate", 1, 3, 4],
  ["messageUpdate", 1, 3, 4, true, "!arg2.content"],
  ["emojiUpdate", 1, 3, 4],
  [],
  [],
  ["messageReactionRemoveAll", 1, 0, 2, true],
  ["guildMemberAvailable", 1, 0, 2],
  ["guildMembersChunk", 1, 0, 3],
  ["guildMemberSpeaking", 1, 3, 2],
  [],
  [],
  ["guildUnavailable", 1, 0, 1],
  ["inviteCreate", 1, 0, 2],
  ["inviteDelete", 1, 0, 2],
  ["webhookUpdate", 1, 0, 1],
];

Events.registerEvents = function (bot) {
  $evts = Bot.$evts;
  for (let i = 0; i < this.data.length; i++) {
    const d = this.data[i];
    if (d.length > 0 && $evts[String(i)]) {
      bot.on(d[0], this.callEvents.bind(this, String(i), d[1], d[2], d[3], !!d[4], d[5]));
    }
  }
  if ($evts["28"]) bot.on("messageReactionAdd", this.onReaction.bind(this, "28"));
  if ($evts["29"]) bot.on("messageReactionRemove", this.onReaction.bind(this, "29"));
  if ($evts["34"]) bot.on("typingStart", this.onTyping.bind(this, "34"));
};

Events.callEvents = function (id, temp1, temp2, server, mustServe, condition, arg1, arg2) {
  if (mustServe && ((temp1 > 0 && !arg1.guild) || (temp2 > 0 && !arg2.guild))) return;
  if (condition && eval(condition)) return;
  const events = $evts[id];
  if (!events) return;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const temp = {};
    if (event.temp) temp[event.temp] = this.getObject(temp1, arg1, arg2);
    if (event.temp2) temp[event.temp2] = this.getObject(temp2, arg1, arg2);
    Actions.invokeEvent(event, this.getObject(server, arg1, arg2), temp);
  }
};

Events.getObject = function (id, arg1, arg2) {
  switch (id) {
    case 1:
      return arg1;
    case 2:
      return arg1.guild;
    case 3:
      return arg2;
    case 4:
      return arg2.guild;
  }
};

Events.onInitialization = function (bot) {
  const events = $evts["1"];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    for (const server of bot.guilds.cache.values()) {
      Actions.invokeEvent(event, server, {});
    }
  }
};

Events.setupIntervals = function (bot) {
  const events = $evts["3"];
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const time = event.temp ? parseFloat(event.temp) : 60;
    setInterval(
      function () {
        for (const server of bot.guilds.cache.values()) {
          Actions.invokeEvent(event, server, {});
        }
      }.bind(this),
      time * 1e3,
    ).unref();
  }
};

Events.onReaction = function (id, reaction, user) {
  const events = $evts[id];
  if (!events) return;
  const server = reaction.message?.guild;
  const member = server?.members.resolve(user);
  if (!member) return;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const temp = {};
    if (event.temp) temp[event.temp] = reaction;
    if (event.temp2) temp[event.temp2] = member;
    Actions.invokeEvent(event, server, temp);
  }
};

Events.onTyping = function (id, channel, user) {
  const events = $evts[id];
  if (!events) return;
  const server = channel.guild;
  const member = server?.members.resolve(user);
  if (!member) return;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const temp = {};
    if (event.temp) temp[event.temp] = channel;
    if (event.temp2) temp[event.temp2] = member;
    Actions.invokeEvent(event, server, temp);
  }
};

Events.onError = function (text, text2, cache) {
  const events = $evts["37"];
  if (!events) return;
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const temp = {};
    if (event.temp) temp[event.temp] = text;
    if (event.temp2) temp[event.temp2] = text2;
    Actions.invokeEvent(event, cache.server, temp);
  }
};

//#endregion

//---------------------------------------------------------------------
//#region Images
// Contains functions for image management.
//---------------------------------------------------------------------

const JIMP = require("jimp");

const Images = (DBM.Images = {});

Images.getImage = function (url) {
  if (!url.startsWith("http")) url = Actions.getLocalFile(url);
  return JIMP.read(url);
};

Images.getFont = function (url) {
  return JIMP.loadFont(Actions.getLocalFile(url));
};

Images.createBuffer = function (image) {
  return new Promise(function (resolve, reject) {
    image.getBuffer(JIMP.MIME_PNG, function (err, buffer) {
      if (err) {
        reject(err);
      } else {
        resolve(buffer);
      }
    });
  });
};

Images.drawImageOnImage = function (img1, img2, x, y) {
  for (let i = 0; i < img2.bitmap.width; i++) {
    for (let j = 0; j < img2.bitmap.height; j++) {
      const pos = i * (img2.bitmap.width * 4) + j * 4;
      const pos2 = (i + y) * (img1.bitmap.width * 4) + (j + x) * 4;
      const target = img1.bitmap.data;
      const source = img2.bitmap.data;
      for (let k = 0; k < 4; k++) {
        target[pos2 + k] = source[pos + k];
      }
    }
  }
};

//#endregion

//---------------------------------------------------------------------
//#region Files
// Contains functions for file management.
//---------------------------------------------------------------------

const Files = (DBM.Files = {});

Files.data = {};
Files.writers = {};
Files.crypto = require("node:crypto");
Files.dataFiles = [
  "commands.json",
  "events.json",
  "settings.json",
  "players.json",
  "servers.json",
  "serverVars.json",
  "globalVars.json",
];

Files.startBot = function () {
  const path = require("node:path");
  Actions.actionsLocation = path.join(__dirname, "actions");
  Actions.eventsLocation = path.join(__dirname, "events");
  Actions.extensionsLocation = path.join(__dirname, "extensions");
  if (this.verifyDirectory(Actions.actionsLocation)) {
    Actions.initMods();
    this.readData(Bot.init.bind(Bot));
  } else {
    console.error(
      'Please copy the "Actions" folder from the Discord Bot Maker directory to this bot\'s directory: \n' +
        Actions.actionsLocation,
    );
  }
};

Files.verifyDirectory = function (dir) {
  return typeof dir === "string" && require("node:fs").existsSync(dir);
};

Files.readData = function (callback) {
  const fs = require("node:fs");
  const path = require("node:path");
  let max = this.dataFiles.length;
  let cur = 0;
  for (let i = 0; i < max; i++) {
    const filePath = path.join(process.cwd(), "data", this.dataFiles[i]);
    if (!fs.existsSync(filePath)) continue;
    fs.readFile(
      filePath,
      function (error, content) {
        const filename = this.dataFiles[i].slice(0, -5);
        let data;
        try {
          if (typeof content !== "string" && content.toString) content = content.toString();
          data = JSON.parse(this.decrypt(content));
        } catch (e) {
          console.error(`There was issue parsing ${this.dataFiles[i]}!`);
          return;
        }
        this.data[filename] = data;
        if (++cur === max) {
          callback();
        }
      }.bind(this),
    );
  }
};

Files.saveData = function (file, callback) {
  const path = require("node:path");
  const data = this.data[file];
  if (!this.writers[file]) {
    const fstorm = require("fstorm");
    this.writers[file] = fstorm(path.join(process.cwd(), "data", file + ".json"));
  }
  this.writers[file].write(
    this.encrypt(JSON.stringify(data)),
    function () {
      if (callback) {
        callback();
      }
    }.bind(this),
  );
};

Files.initEncryption = function () {
  try {
    this.password = require("discord-bot-maker");
  } catch {
    this.password = "";
  }
};

Files.encrypt = function (text) {
  if (this.password.length === 0) return text;
  const cipher = this.crypto.createCipher("aes-128-ofb", this.password);
  let crypted = cipher.update(text, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted;
};

Files.decrypt = function (text) {
  if (this.password.length === 0) return text;
  const decipher = this.crypto.createDecipher("aes-128-ofb", this.password);
  let dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
};

Files.convertItem = function (item) {
  if (Array.isArray(item)) {
    const result = [];
    const length = item.length;
    for (let i = 0; i < length; i++) {
      result[i] = this.convertItem(item[i]);
    }
    return result;
  } else if (typeof item !== "object") {
    let result = "";
    try {
      result = JSON.stringify(item);
    } catch {}
    if (result !== "{}") {
      return item;
    }
  } else if (item.convertToString) {
    return item.convertToString();
  }
  return null;
};

Files.saveServerVariable = function (serverId, varName, item) {
  this.data.serverVars[serverId] ??= {};
  const strItem = this.convertItem(item);
  if (strItem !== null) {
    this.data.serverVars[serverId][varName] = strItem;
  }
  this.saveData("serverVars");
};

Files.restoreServerVariables = function () {
  const keys = Object.keys(this.data.serverVars);
  for (let i = 0; i < keys.length; i++) {
    const varNames = Object.keys(this.data.serverVars[keys[i]]);
    for (let j = 0; j < varNames.length; j++) {
      this.restoreVariable(this.data.serverVars[keys[i]][varNames[j]], 2, varNames[j], keys[i]);
    }
  }
};

Files.saveGlobalVariable = function (varName, item) {
  const strItem = this.convertItem(item);
  if (strItem !== null) {
    this.data.globalVars[varName] = strItem;
  }
  this.saveData("globalVars");
};

Files.restoreGlobalVariables = function () {
  const keys = Object.keys(this.data.globalVars);
  for (let i = 0; i < keys.length; i++) {
    this.restoreVariable(this.data.globalVars[keys[i]], 3, keys[i]);
  }
};

Files.restoreVariable = function (value, type, varName, serverId) {
  const bot = Bot.bot;
  let cache = {};
  if (serverId) {
    cache.server = { id: serverId };
  }
  if (typeof value === "string" || Array.isArray(value)) {
    this.restoreValue(value, bot)
      .then(
        function (finalValue) {
          if (finalValue) {
            Actions.storeValue(finalValue, type, varName, cache);
          }
        }.bind(this),
      )
      .catch(() => {});
  } else {
    Actions.storeValue(value, type, varName, cache);
  }
};

Files.restoreValue = function (value, bot) {
  return new Promise(
    function (resolve, reject) {
      if (typeof value === "string") {
        if (value.startsWith("mem-")) {
          return resolve(this.restoreMember(value, bot));
        } else if (value.startsWith("msg-")) {
          return this.restoreMessage(value, bot).then(resolve).catch(reject);
        } else if (value.startsWith("tc-")) {
          return resolve(this.restoreTextChannel(value, bot));
        } else if (value.startsWith("vc-")) {
          return resolve(this.restoreVoiceChannel(value, bot));
        } else if (value.startsWith("r-")) {
          return resolve(this.restoreRole(value, bot));
        } else if (value.startsWith("s-")) {
          return resolve(this.restoreServer(value, bot));
        } else if (value.startsWith("e-")) {
          return resolve(this.restoreEmoji(value, bot));
        } else if (value.startsWith("usr-")) {
          return resolve(this.restoreUser(value, bot));
        }
        resolve(value);
      } else if (Array.isArray(value)) {
        const result = [];
        const length = value.length;
        let curr = 0;
        for (let i = 0; i < length; i++) {
          this.restoreValue(value[i], bot)
            .then(function (item) {
              result[i] = item;
              if (++curr >= length) {
                resolve(result);
              }
            })
            .catch(function () {
              if (++curr >= length) {
                resolve(result);
              }
            });
        }
      } else {
        resolve(value);
      }
    }.bind(this),
  );
};

Files.restoreMember = function (value, bot) {
  const split = value.split("_");
  const memId = split[0].slice(4);
  const serverId = split[1].slice(2);
  const server = bot.guilds.get(serverId);
  if (server) {
    return server.members.resolve(memId);
  }
};

Files.restoreMessage = function (value, bot) {
  const split = value.split("_");
  const msgId = split[0].slice(4);
  const channelId = split[1].slice(2);
  const channel = bot.channels.resolve(channelId);
  if (channel) {
    return channel.messages.fetch(msgId);
  }
};

Files.restoreTextChannel = function (value, bot) {
  const channelId = value.slice(3);
  return bot.channels.resolve(channelId);
};

Files.restoreVoiceChannel = function (value, bot) {
  const channelId = value.slice(3);
  return bot.channels.resolve(channelId);
};

Files.restoreRole = function (value, bot) {
  const split = value.split("_");
  const roleId = split[0].slice(2);
  const serverId = split[1].slice(2);
  const server = bot.guilds.resolve(serverId);
  if (server && server.roles && server.roles.cache) {
    return server.roles.resolve(roleId);
  }
};

Files.restoreServer = function (value, bot) {
  const serverId = value.slice(2);
  return bot.guilds.resolve(serverId);
};

Files.restoreEmoji = function (value, bot) {
  const emojiId = value.slice(2);
  return bot.emojis.resolve(emojiId);
};

Files.restoreUser = function (value, bot) {
  const userId = value.slice(4);
  return bot.users.resolve(userId);
};

Files.initEncryption();

//#endregion

//---------------------------------------------------------------------
//#region Audio
// Contains functions for voice channel stuff.
//---------------------------------------------------------------------

const Audio = (DBM.Audio = {});

Audio.ytdl = null;
try {
  Audio.ytdl = require("ytdl-core");
} catch {}

Audio.voice = null;
try {
  Audio.voice = require("@discordjs/voice");
} catch {}

Audio.queue = [];
Audio.volumes = [];
Audio.connections = [];
Audio.dispatchers = [];

Audio.isConnected = function (cache) {
  if (!cache.server) return false;
  const id = cache.server.id;
  return this.connections[id];
};

Audio.isPlaying = function (cache) {
  if (!cache.server) return false;
  const id = cache.server.id;
  return this.dispatchers[id];
};

Audio.setVolume = function (volume, cache) {
  if (!cache.server) return;
  const id = cache.server.id;
  if (this.dispatchers[id]) {
    this.volumes[id] = volume;
    this.dispatchers[id].setVolumeLogarithmic(volume);
  }
};

Audio.connectToVoice = function (voiceChannel) {
  const promise = voiceChannel.join();
  promise
    .then(
      function (connection) {
        this.connections[voiceChannel.guild.id] = connection;
        connection.on(
          "disconnect",
          function () {
            this.connections[voiceChannel.guild.id] = null;
            this.volumes[voiceChannel.guild.id] = null;
          }.bind(this),
        );
      }.bind(this),
    )
    .catch(console.error);
  return promise;
};

Audio.addToQueue = function (item, cache) {
  if (!cache.server) return;
  const id = cache.server.id;
  if (!this.queue[id]) this.queue[id] = [];
  this.queue[id].push(item);
  this.playNext(id);
};

Audio.clearQueue = function (cache) {
  if (!cache.server) return;
  const id = cache.server.id;
  this.queue[id] = [];
};

Audio.playNext = function (id, forceSkip) {
  if (!this.connections[id]) return;
  if (!this.dispatchers[id] || !!forceSkip) {
    if (!this.queue[id]) this.queue[id] = [];
    if (this.queue[id] && this.queue[id].length > 0) {
      const item = this.queue[id].shift();
      this.playItem(item, id);
    } else {
      this.connections[id].disconnect();
    }
  }
};

Audio.playItem = function (item, id) {
  if (!this.connections[id]) return;
  if (this.dispatchers[id]) {
    this.dispatchers[id]._forceEnd = true;
    this.dispatchers[id].destroy();
  }

  const type = item[0];
  let setupDispatcher = false;
  switch (type) {
    case "file":
      setupDispatcher = this.playFile(item[2], item[1], id);
      break;
    case "url":
      setupDispatcher = this.playUrl(item[2], item[1], id);
      break;
    case "yt":
      setupDispatcher = this.playYt(item[2], item[1], id);
      break;
  }

  if (setupDispatcher && !this.dispatchers[id]._eventSetup) {
    this.dispatchers[id].on(
      "finish",
      function () {
        const isForced = this.dispatchers[id]._forceEnd;
        this.dispatchers[id] = null;
        if (!isForced) {
          this.playNext(id);
        }
      }.bind(this),
    );
    this.dispatchers[id]._eventSetup = true;
  }
};

Audio.playFile = function (url, options, id) {
  this.dispatchers[id] = this.connections[id].play(Actions.getLocalFile(url), options);
  return true;
};

Audio.playUrl = function (url, options, id) {
  this.dispatchers[id] = this.connections[id].play(url, options);
  return true;
};

Audio.playYt = function (url, options, id) {
  if (!this.ytdl) return false;
  const stream = this.ytdl(url, {
    quality: "highestaudio",
    filter: "audioonly",
    highWaterMark: 26214400, // 25mb
  });
  options.highWaterMark = 1;
  this.dispatchers[id] = this.connections[id].play(stream, options);
  return true;
};

//#endregion

//---------------------------------------------------------------------
//#region Custom structures
//---------------------------------------------------------------------

//---------------------------------------------------------------------
// GuildMember
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.GuildMember.prototype, "unban", {
  value: function (server, reason) {
    return server.bans.remove(this.id, reason);
  },
});

Reflect.defineProperty(DiscordJS.GuildMember.prototype, "data", {
  value: function (name, defaultValue) {
    const id = this.id;
    const data = Files.data.players;
    if (data[id] === undefined) {
      if (defaultValue === undefined) {
        return null;
      } else {
        data[id] = {};
      }
    }
    if (data[id][name] === undefined && defaultValue !== undefined) {
      data[id][name] = defaultValue;
    }
    return data[id][name];
  },
});

Reflect.defineProperty(DiscordJS.GuildMember.prototype, "setData", {
  value: function (name, value) {
    const id = this.id;
    const data = Files.data.players;
    if (data[id] === undefined) {
      data[id] = {};
    }
    data[id][name] = value;
    Files.saveData("players");
  },
});

Reflect.defineProperty(DiscordJS.GuildMember.prototype, "addData", {
  value: function (name, value) {
    const id = this.id;
    const data = Files.data.players;
    if (data[id] === undefined) {
      data[id] = {};
    }
    if (data[id][name] === undefined) {
      this.setData(name, value);
    } else {
      this.setData(name, this.data(name) + value);
    }
  },
});

Reflect.defineProperty(DiscordJS.GuildMember.prototype, "convertToString", {
  value: function () {
    return `mem-${this.id}_s-${this.guild.id}`;
  },
});

//---------------------------------------------------------------------
// User
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.User.prototype, "data", {
  value: function (name, defaultValue) {
    const id = this.id;
    const data = Files.data.players;
    if (data[id] === undefined) {
      if (defaultValue === undefined) {
        return null;
      } else {
        data[id] = {};
      }
    }
    if (data[id][name] === undefined && defaultValue !== undefined) {
      data[id][name] = defaultValue;
    }
    return data[id][name];
  },
});

Reflect.defineProperty(DiscordJS.User.prototype, "setData", {
  value: function (name, value) {
    const id = this.id;
    const data = Files.data.players;
    if (data[id] === undefined) {
      data[id] = {};
    }
    data[id][name] = value;
    Files.saveData("players");
  },
});

Reflect.defineProperty(DiscordJS.User.prototype, "addData", {
  value: function (name, value) {
    const id = this.id;
    const data = Files.data.players;
    if (data[id] === undefined) {
      data[id] = {};
    }
    if (data[id][name] === undefined) {
      this.setData(name, value);
    } else {
      this.setData(name, this.data(name) + value);
    }
  },
});

Reflect.defineProperty(DiscordJS.User.prototype, "convertToString", {
  value: function () {
    return `usr-${this.id}`;
  },
});

//---------------------------------------------------------------------
// Guild
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.Guild.prototype, "getDefaultChannel", {
  value: function () {
    let channel = this.channels.resolve(this.id);
    if (!channel) {
      [...this.channels.cache.values()].forEach((c) => {
        if (
          c.permissionsFor(DBM.Bot.bot.user)?.has(DiscordJS.Permissions.FLAGS.SEND_MESSAGES) &&
          c.type === "GUILD_TEXT" &&
          c.type === "GUILD_NEWS"
        ) {
          if (!channel || channel.position > c.position) {
            channel = c;
          }
        }
      });
    }
    return channel;
  },
});

Reflect.defineProperty(DiscordJS.Guild.prototype, "getDefaultVoiceChannel", {
  value: function () {
    let channel = this.channels.resolve(this.id);
    if (!channel) {
      [...this.channels.cache.values()].forEach((c) => {
        if (
          c.permissionsFor(DBM.Bot.bot.user)?.has(DiscordJS.Permissions.FLAGS.SEND_MESSAGES) &&
          c.type === "GUILD_VOICE"
        ) {
          if (!channel || channel.position > c.position) {
            channel = c;
          }
        }
      });
    }
    return channel;
  },
});

Reflect.defineProperty(DiscordJS.Guild.prototype, "data", {
  value: function (name, defaultValue) {
    const id = this.id;
    const data = Files.data.servers;
    if (data[id] === undefined) {
      if (defaultValue === undefined) {
        return null;
      } else {
        data[id] = {};
      }
    }
    if (data[id][name] === undefined && defaultValue !== undefined) {
      data[id][name] = defaultValue;
    }
    return data[id][name];
  },
});

Reflect.defineProperty(DiscordJS.Guild.prototype, "setData", {
  value: function (name, value) {
    const id = this.id;
    const data = Files.data.servers;
    if (data[id] === undefined) {
      data[id] = {};
    }
    data[id][name] = value;
    Files.saveData("servers");
  },
});

Reflect.defineProperty(DiscordJS.Guild.prototype, "addData", {
  value: function (name, value) {
    const id = this.id;
    const data = Files.data.servers;
    if (data[id] === undefined) {
      data[id] = {};
    }
    if (data[id][name] === undefined) {
      this.setData(name, value);
    } else {
      this.setData(name, this.data(name) + value);
    }
  },
});

Reflect.defineProperty(DiscordJS.Guild.prototype, "convertToString", {
  value: function () {
    return `s-${this.id}`;
  },
});

//---------------------------------------------------------------------
// Message
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.Message.prototype, "convertToString", {
  value: function () {
    return `msg-${this.id}_c-${this.channel.id}`;
  },
});

//---------------------------------------------------------------------
// TextChannel
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.TextChannel.prototype, "convertToString", {
  value: function () {
    return `tc-${this.id}`;
  },
});

//---------------------------------------------------------------------
// VoiceChannel
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.VoiceChannel.prototype, "convertToString", {
  value: function () {
    return `vc-${this.id}`;
  },
});

//---------------------------------------------------------------------
// Role
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.Role.prototype, "convertToString", {
  value: function () {
    return `r-${this.id}_s-${this.guild.id}`;
  },
});

//---------------------------------------------------------------------
// Emoji
//---------------------------------------------------------------------

Reflect.defineProperty(DiscordJS.GuildEmoji.prototype, "convertToString", {
  value: function () {
    return `e-${this.id}`;
  },
});

//#endregion

//---------------------------------------------------------------------
// Start Bot
//---------------------------------------------------------------------

Files.startBot();
