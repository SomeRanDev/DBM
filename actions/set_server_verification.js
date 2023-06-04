module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Set Server Verification",

  //---------------------------------------------------------------------
  // Action Section
  //
  // This is the section the action will fall into.
  //---------------------------------------------------------------------

  section: "Server Control",

  //---------------------------------------------------------------------
  // Action Subtitle
  //
  // This function generates the subtitle displayed next to the name.
  //---------------------------------------------------------------------

  subtitle: function (data, presets) {
    const verifications = ["None", "Low", "Medium", "(╯°□°）╯︵ ┻━┻", "┻━┻彡 ヽ(ಠДಠ)ノ彡┻━┻﻿"];
    return `${presets.getServerText(data.server, data.varName)} - ${verifications[parseInt(data.verification, 10)]}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["server", "varName", "verification", "reason"],

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
<server-input dropdownLabel="Server" selectId="server" variableContainerId="varNameContainer" variableInputId="varName"></server-input>

<br><br><br>

<div style="padding-top: 8px; width: 90%;">
	<span class="dbminputlabel">Verification Level</span><br>
	<select id="verification" class="round">
		<option value="0">None</option>
		<option value="1">Low</option>
		<option value="2">Medium</option>
		<option value="3">(╯°□°）╯︵ ┻━┻</option>
		<option value="4">┻━┻彡 ヽ(ಠДಠ)ノ彡┻━┻﻿</option>
	</select>
</div>

<br>

<div>
  <span class="dbminputlabel">Reason</span>
  <input id="reason" placeholder="Optional" class="round" type="text">
</div>`;
  },

  //---------------------------------------------------------------------
  // Action Editor Init Code
  //
  // When the HTML is first applied to the action editor, this code
  // is also run. This helps add modifications or setup reactionary
  // functions for the DOM elements.
  //---------------------------------------------------------------------

  init: function () {},

  //---------------------------------------------------------------------
  // Action Bot Function
  //
  // This is the function for the action within the Bot's Action class.
  // Keep in mind event calls won't have access to the "msg" parameter,
  // so be sure to provide checks for variable existence.
  //---------------------------------------------------------------------

  action: function (cache) {
    const data = cache.actions[cache.index];
    const type = parseInt(data.server, 10);
    const varName = this.evalMessage(data.varName, cache);
    const server = this.getServer(type, varName, cache);
    const reason = this.evalMessage(data.reason, cache);
    if (Array.isArray(server)) {
      this.callListFunc(server, "setVerificationLevel", [parseInt(data.verification, 10), reason]).then(() =>
        this.callNextAction(cache),
      );
    } else if (server && server.setVerificationLevel) {
      server
        .setVerificationLevel(parseInt(data.verification, 10), reason)
        .then(() => this.callNextAction(cache))
        .catch((err) => this.displayError(data, cache, err));
    } else {
      this.callNextAction(cache);
    }
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
