module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Create Invite",

  //---------------------------------------------------------------------
  // Action Section
  //
  // This is the section the action will fall into.
  //---------------------------------------------------------------------

  section: "Channel Control",

  //---------------------------------------------------------------------
  // Action Subtitle
  //
  // This function generates the subtitle displayed next to the name.
  //---------------------------------------------------------------------

  subtitle: function (data, presets) {
    return `Invite to ${presets.getChannelText(data.channel, data.varName)}`;
  },

  //---------------------------------------------------------------------
  // Action Storage Function
  //
  // Stores the relevant variable info for the editor.
  //---------------------------------------------------------------------

  variableStorage: function (data, varType) {
    const type = parseInt(data.storage, 10);
    if (type !== varType) return;
    return [data.varName2, "Text"];
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["channel", "varName", "maxUses", "lifetime", "tempInvite", "unique", "storage", "varName2", "reason"],

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
<channel-input dropdownLabel="Source Channel" selectId="channel" variableContainerId="varNameContainer" variableInputId="varName"></channel-input>

<br><br><br>

<div style="padding-top: 8px;">
	<div style="float: left; width: 70%;">
		<span class="dbminputlabel">Max Uses</span><br>
		<input id="maxUses" class="round" type="text" placeholder="Leave blank for infinite uses!"><br>
		<span class="dbminputlabel">Invite Lifetime (in seconds)</span><br>
		<input id="lifetime" class="round" type="text" placeholder="Leave blank to last forever!"><br>
	</div>
	<div style="float: right; width: 30%;">
		<span class="dbminputlabel">Temporary Invite</span><br>
		<select id="tempInvite" class="round" style="width: 90%;">
			<option value="true">Yes</option>
			<option value="false" selected>No</option>
		</select><br>
		<span class="dbminputlabel">Is Unique</span><br>
		<select id="unique" class="round" style="width: 90%;">
			<option value="true" selected>Yes</option>
			<option value="false">No</option>
		</select>
	</div>
</div>

<br><br><br>

<store-in-variable allowNone style="padding-top: 8px;" selectId="storage" variableInputId="varName2" variableContainerId="varNameContainer2"></store-in-variable>

<br><br><br><br><br><br><br>

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
    const storage = parseInt(data.channel, 10);
    const varName = this.evalMessage(data.varName, cache);
    const channel = this.getChannel(storage, varName, cache);
    const reason = this.evalMessage(data.reason, cache);
    const options = {};
    if (data.maxUses) {
      options.maxUses = parseInt(this.evalMessage(data.maxUses, cache), 10);
    } else {
      options.maxUses = 0;
    }
    if (data.lifetime) {
      options.maxAge = parseInt(this.evalMessage(data.lifetime, cache), 10);
    } else {
      options.maxAge = 0;
    }
    if (reason) {
      options.reason = reason;
    }
    options.maxUses = data.temporary === "true";
    options.unique = data.unique === "true";
    if (Array.isArray(channel)) {
      this.callListFunc(channel, "createInvite", [options]).then(
        function (invite) {
          const varName2 = this.evalMessage(data.varName2, cache);
          const storage2 = parseInt(data.storage, 10);
          this.storeValue(invite.url, storage2, varName2, cache);
          this.callNextAction(cache);
        }.bind(this),
      );
    } else if (channel && channel.createInvite) {
      channel
        .createInvite(options)
        .then(
          function (invite) {
            const varName2 = this.evalMessage(data.varName2, cache);
            const storage2 = parseInt(data.storage, 10);
            this.storeValue(invite.url, storage2, varName2, cache);
            this.callNextAction(cache);
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
