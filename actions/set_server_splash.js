module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Set Server Splash Screen",

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
    const storeTypes = presets.variables;
    return `${presets.getServerText(data.server, data.varName)} - ${storeTypes[parseInt(data.storage, 10)]} (${data.varName2})`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["server", "varName", "storage", "varName2", "reason"],

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
	<p>
		<u>Note:</u><br>
		Discord Splash Screens are only available to Discord Partners or for servers with boost level 1 or higher.<br>
		For more information, check out <a href="#" onclick="require('node:child_process').execSync('start https://discord.com/partners')">this</a> or <a href="#" onclick="require('node:child_process').execSync('start https://support.discord.com/hc/en-us/articles/360028038352')"">this</a>.
	</p>
</div>

<br>

<server-input dropdownLabel="Server" selectId="server" variableContainerId="varNameContainer" variableInputId="varName"></server-input>

<br><br><br>

<store-in-variable style="padding-top: 8px;" dropdownLabel="Source Image" selectId="storage" variableContainerId="varNameContainer2" variableInputId="varName2"></store-in-variable>

<br><br><br>

<div style="padding-top: 8px;">
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
    if (Array.isArray(server) || (server && server.setSplash)) {
      const type = parseInt(data.storage, 10);
      const varName2 = this.evalMessage(data.varName2, cache);
      const image = this.getVariable(type, varName2, cache);
      const Images = this.getDBM().Images;
      Images.createBuffer(image)
        .then(
          function (buffer) {
            if (Array.isArray(server)) {
              this.callListFunc(server, "setSplash", [buffer, reason]).then(() => this.callNextAction(cache));
            } else {
              server
                .setSplash(buffer, reason)
                .then(() => this.callNextAction(cache))
                .catch((err) => this.displayError(data, cache, err));
            }
          }.bind(this),
        )
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
