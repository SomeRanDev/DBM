module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Edit Role",

  //---------------------------------------------------------------------
  // Action Section
  //
  // This is the section the action will fall into.
  //---------------------------------------------------------------------

  section: "Role Control",

  //---------------------------------------------------------------------
  // Action Subtitle
  //
  // This function generates the subtitle displayed next to the name.
  //---------------------------------------------------------------------

  subtitle(data, presets) {
    return `${presets.getRoleText(data.storage, data.varName)}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["roleName", "hoist", "mentionable", "color", "position", "storage", "varName", "reason"],

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

  html(isEvent, data) {
    return `
<role-input dropdownLabel="Source Role" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></role-input>

<br><br><br>

<div style="padding-top: 8px;">
	<span class="dbminputlabel">Name</span><br>
	<input id="roleName" placeholder="Leave blank to not edit!" class="round" type="text">
</div>

<br>

<div style="float: left; width: 50%;">
	<span class="dbminputlabel">Display Separate from Online Users</span><br>
	<select id="hoist" class="round" style="width: 90%;">
		<option value="none" selected>Don't Edit</option>
		<option value="true">Yes</option>
		<option value="false">No</option>
	</select><br>
	<span class="dbminputlabel">Mentionable</span><br>
	<select id="mentionable" class="round" style="width: 90%;">
		<option value="none" selected>Don't Edit</option>
		<option value="true">Yes</option>
		<option value="false">No</option>
	</select><br>
</div>

<div style="float: right; width: 50%;">
	<span class="dbminputlabel">Color</span><br>
	<input id="color" class="round" type="text" placeholder="Leave blank to not edit!"><br>
	<span class="dbminputlabel">Position</span><br>
	<input id="position" class="round" type="text" placeholder="Leave blank to not edit!" style="width: 90%;"><br>
</div>

<br><br><br>

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

  init() {},

  //---------------------------------------------------------------------
  // Action Bot Function
  //
  // This is the function for the action within the Bot's Action class.
  // Keep in mind event calls won't have access to the "msg" parameter,
  // so be sure to provide checks for variable existence.
  //---------------------------------------------------------------------

  action(cache) {
    const data = cache.actions[cache.index];
    const reason = this.evalMessage(data.reason, cache);
    const roleData = {};
    if (data.roleName) {
      roleData.name = this.evalMessage(data.roleName, cache);
    }
    if (data.color) {
      roleData.color = this.evalMessage(data.color, cache);
    }
    if (data.position) {
      roleData.position = parseInt(this.evalMessage(data.position, cache), 10);
    }
    if (data.hoist !== "none") {
      roleData.hoist = JSON.parse(data.hoist);
    }
    if (data.mentionable !== "none") {
      roleData.mentionable = JSON.parse(data.mentionable);
    }
    const storage = parseInt(data.storage, 10);
    const varName = this.evalMessage(data.varName, cache);
    const role = this.getRole(storage, varName, cache);
    if (Array.isArray(role)) {
      this.callListFunc(role, "edit", [roleData, reason]).then(() => this.callNextAction(cache));
    } else if (role?.edit) {
      role
        .edit(roleData, reason)
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

  mod() {},
};
