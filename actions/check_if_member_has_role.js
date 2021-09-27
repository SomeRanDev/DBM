module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Check If Member has Role",

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

  fields: ["member", "varName", "role", "varName2", "branch"],

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
<member-input dropdownLabel="Source Member" selectId="member" variableContainerId="varNameContainer" variableInputId="varName"></member-input>

<br><br><br>

<role-input style="padding-top: 8px;" dropdownLabel="Source Role" selectId="role" variableContainerId="varNameContainer2" variableInputId="varName2"></role-input>

<br><br><br>

<conditional-input id="branch" style="padding-top: 8px;"></conditional-input>`;
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

    const type = parseInt(data.member, 10);
    const varName = this.evalMessage(data.varName, cache);
    const member = this.getMember(type, varName, cache);

    const type2 = parseInt(data.role, 10);
    const varName2 = this.evalMessage(data.varName2, cache);
    const role = this.getRole(type2, varName2, cache);

    let result = false;
    if (role) {
      if (Array.isArray(member)) {
        result = member.every((mem) => mem?.roles?.cache.has(role.id) ?? false);
      } else if (member?.roles) {
        result = member.roles.cache.has(role.id);
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
