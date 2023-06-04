module.exports = {
  //---------------------------------------------------------------------
  // Command Only
  //
  // If this is 'true', then this will only be available for commands.
  //---------------------------------------------------------------------

  commandOnly: true,

  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Store Command Params",

  //---------------------------------------------------------------------
  // Action Section
  //
  // This is the section the action will fall into.
  //---------------------------------------------------------------------

  section: "Other Stuff",

  //---------------------------------------------------------------------
  // Action Subtitle
  //
  // This function generates the subtitle displayed next to the name.
  //---------------------------------------------------------------------

  subtitle: function (data, presets) {
    const infoSources = [
      "One Parameter",
      "Multiple Parameters",
      "Mentioned Member",
      "Mentioned Role",
      "Mentioned Channel",
    ];
    return `${infoSources[parseInt(data.info, 10)]} #${data.infoIndex}`;
  },

  //---------------------------------------------------------------------
  // Action Storage Function
  //
  // Stores the relevant variable info for the editor.
  //---------------------------------------------------------------------

  variableStorage: function (data, varType) {
    const type = parseInt(data.storage, 10);
    if (type !== varType) return;
    const info = parseInt(data.info, 10);
    let dataType = "None";
    switch (info) {
      case 0:
      case 1:
        dataType = "Text";
        break;
      case 2:
        dataType = "Server Member";
        break;
      case 3:
        dataType = "Role";
        break;
      case 4:
        dataType = "Channel";
        break;
    }
    return [data.varName, dataType];
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["info", "infoIndex", "storage", "varName"],

  //---------------------------------------------------------------------
  // Command HTML
  //
  // This function returns a string containing the HTML used for
  // editing actions.
  //
  // The "isEvent" parameter will be true if this action is being used
  // for an event. Due to their nature, events lack certain information,
  // so edit the HTML to reflect this.
  //
  // The "data" parameter stores constants for select elements to use.
  // Each is an array: index 0 for commands, index 1 for events.
  // The names are: sendTargets, members, roles, channels,
  //                messages, servers, variables
  //---------------------------------------------------------------------

  html: function (isEvent, data) {
    return `
<div>
	<div style="float: left; width: 35%;">
		<span class="dbminputlabel">Source Info</span><br>
		<select id="info" class="round" onchange="glob.onSourceInfoChanged(this)">
			<option value="0" selected>One Parameter</option>
			<option value="1">Multiple Parameters</option>
			<option value="2">Mentioned Member</option>
			<option value="3">Mentioned Role</option>
			<option value="4">Mentioned Channel</option>
		</select>
	</div>
	<div style="float: right; width: 60%;">
		<span class="dbminputlabel" id="infoCountLabel">Parameter Number:</span>
		<input id="infoIndex" class="round" type="text" value="1"><br>
	</div>
</div>

<br><br><br><br>

<store-in-variable dropdownLabel="Store In" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></store-in-variable>`;
  },

  //---------------------------------------------------------------------
  // Action Editor Init Code
  //
  // When the HTML is first applied to the action editor, this code
  // is also run. This helps add modifications or setup reactionary
  // functions for the DOM elements.
  //---------------------------------------------------------------------

  init: function () {
    const { glob, document } = this;

    glob.onSourceInfoChanged = function (event) {
      const value = parseInt(event.value, 10);
      const infoCountLabel = document.getElementById("infoCountLabel");
      switch (value) {
        case 0:
          infoCountLabel.innerHTML = "Parameter Number";
          break;
        case 1:
          infoCountLabel.innerHTML = "Starting From Parameter Number";
          break;
        case 2:
          infoCountLabel.innerHTML = "Member Mention Number";
          break;
        case 3:
          infoCountLabel.innerHTML = "Role Mention Number";
          break;
        case 4:
          infoCountLabel.innerHTML = "Channel Mention Number";
          break;
        default:
          infoCountLabel.innerHTML = "";
          break;
      }
    };

    glob.onSourceInfoChanged(document.getElementById("info"));
  },

  //---------------------------------------------------------------------
  // Action Bot Function
  //
  // This is the function for the action within the Bot's Action class.
  // Keep in mind event calls won't have access to the "msg" parameter,
  // so be sure to provide checks for variable existence.
  //---------------------------------------------------------------------

  action: function (cache) {
    const data = cache.actions[cache.index];
    const msg = cache.msg;
    if (!msg) return this.callNextAction(cache);
    const infoType = parseInt(data.info, 10);
    const index = parseInt(this.evalMessage(data.infoIndex, cache), 10);
    const separator = this.getDBM().Files.data.settings.separator || "\\s+";
    let source;
    switch (infoType) {
      case 0:
        if (msg.content) {
          const params = msg.content.split(new RegExp(separator));
          source = params[index] || "";
        }
        break;
      case 1:
        if (msg.content) {
          const params = msg.content.split(new RegExp(separator));
          source = "";
          for (let i = 0; i < index; i++) {
            source += params[i] + " ";
          }
          const location = msg.content.indexOf(source);
          if (location === 0) {
            source = msg.content.substring(source.length);
          }
        }
        break;
      case 2:
        if (msg.mentions.members.size) {
          const members = [...msg.mentions.members.values()];
          if (members[index - 1]) {
            source = members[index - 1];
          }
        }
        break;
      case 3:
        if (msg.mentions.roles.size) {
          const roles = [...msg.mentions.roles.values()];
          if (roles[index - 1]) {
            source = roles[index - 1];
          }
        }
        break;
      case 4:
        if (msg.mentions.channels.size) {
          const channels = [...msg.mentions.channels.values()];
          if (channels[index - 1]) {
            source = channels[index - 1];
          }
        }
        break;
      default:
        break;
    }
    if (source) {
      const storage = parseInt(data.storage, 10);
      const varName = this.evalMessage(data.varName, cache);
      this.storeValue(source, storage, varName, cache);
    }
    this.callNextAction(cache);
  },

  //---------------------------------------------------------------------
  // Action Bot Mod
  //
  // Upon initialization of the bot, this code is run. Using the bot's
  // DBM namespace, one can add/modify existing functions if necessary.
  // In order to reduce conflicts between mods, be sure to alias
  // functions you wish to overwrite.
  //---------------------------------------------------------------------

  mod: function () {},
};
