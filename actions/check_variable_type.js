module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Check Variable Type",

  //---------------------------------------------------------------------
  // Action Section
  //
  // This is the section the action will fall into.
  //---------------------------------------------------------------------

  section: "Conditions",

  //---------------------------------------------------------------------
  // Action Subtitle
  //
  // This function generates the subtitle displayed next to the name.
  //---------------------------------------------------------------------

  subtitle(data, presets) {
    return `${presets.getConditionsText(data)}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["storage", "varName", "comparison", "branch"],

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
<retrieve-from-variable dropdownLabel="Variable" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></retrieve-from-variable>

<br><br><br>

<div style="padding-top: 8px; width: 80%;">
		<span class="dbminputlabel">Variable Type to Check</span><br>
		<select id="comparison" class="round">
			<option value="0" selected>Number</option>
			<option value="1">String</option>
			<option value="2">Image</option>
			<option value="3">Member</option>
			<option value="4">Message</option>
			<option value="5">Text Channel</option>
			<option value="6">Voice Channel</option>
			<option value="7">Role</option>
			<option value="8">Server</option>
			<option value="9">Emoji</option>
		</select>
</div>

<br>

<conditional-input id="branch"></conditional-input>`;
  },

  //---------------------------------------------------------------------
  // Action Editor Pre-Init Code
  //
  // Before the fields from existing data in this action are applied
  // to the user interface, this function is called if it exists.
  // The existing data is provided, and a modified version can be 
  // returned. The returned version will be used if provided.
  // This is to help provide compatibility with older versions of the action.
  //
  // The "formatters" argument contains built-in functions for formatting
  // the data required for official DBM action compatibility.
  //---------------------------------------------------------------------

  preInit(data, formatters) {
    return formatters.compatibility_2_0_0_iftruefalse_to_branch(data);
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
    const type = parseInt(data.storage, 10);
    const varName = this.evalMessage(data.varName, cache);
    const variable = this.getVariable(type, varName, cache);
    let result = false;
    if (variable) {
      const DiscordJS = this.getDBM().DiscordJS;
      const compare = parseInt(data.comparison, 10);
      switch (compare) {
        case 0:
          result = typeof variable === "number";
          break;
        case 1:
          result = typeof variable === "string";
          break;
        case 2:
          result = variable instanceof this.getDBM().JIMP;
          break;
        case 3:
          result = variable instanceof DiscordJS.GuildMember;
          break;
        case 4:
          result = variable instanceof DiscordJS.Message;
          break;
        case 5:
          result =
            variable instanceof DiscordJS.TextChannel ||
            variable instanceof DiscordJS.NewsChannel ||
            variable instanceof DiscordJS.StoreChannel;
          break;
        case 6:
          result = variable instanceof DiscordJS.VoiceChannel;
          break;
        case 7:
          result = variable instanceof DiscordJS.Role;
          break;
        case 8:
          result = variable instanceof DiscordJS.Guild;
          break;
        case 9:
          result = variable instanceof DiscordJS.Emoji || variable instanceof DiscordJS.GuildEmoji;
          break;
      }
    }
    this.executeResults(result, data?.branch ?? data, cache);
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
