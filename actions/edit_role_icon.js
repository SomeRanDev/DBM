module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Edit Role Icon",

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
    return `Set Icon of ${presets.getRoleText(data.role, data.roleVarName)} to ${presets.getVariableText(data.image, data.imageVarName)}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["role", "roleVarName", "image", "imageVarName", "reason"],

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
<div>
  <p>
    <u>Note:</u><br>
    Role icons only work in servers with a high enough boost level. If you are having issues, please ensure you are able to set role icons yourself before attempting with the bot.
  </p>
</div>

<br>

<hr class="subtlebar">

<br>

<role-input dropdownLabel="Source Role" selectId="role" variableContainerId="varNameContainer" variableInputId="roleVarName"></role-input>

<br><br><br><br>

<retrieve-from-variable dropdownLabel="Source Image" selectId="image" variableContainerId="varNameContainer2" variableInputId="imageVarName"></retrieve-from-variable>

<br><br><br><br>

<span class="dbminputlabel">Reason</span>
<input id="reason" placeholder="Optional" class="round" type="text">`;
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
//  fields: ["role", "roleVarName", "image", "imageVarName", "reason"],
  action(cache) {
    const data = cache.actions[cache.index];
    const reason = this.evalMessage(data.reason, cache);

    const roleStorage = parseInt(data.role, 10);
    const roleVarName = this.evalMessage(data.roleVarName, cache);
    const role = this.getRole(roleStorage, roleVarName, cache);

    const imageStorage = parseInt(data.image, 10);
    const imageVarName = this.evalMessage(data.imageVarName, cache);
    const image = this.getVariable(imageStorage, imageVarName, cache);

    const Images = this.getDBM().Images;
    Images.createBuffer(image)
      .then((buffer) => {
        if (Array.isArray(role)) {
          this.callListFunc(role, "setIcon", [buffer, reason])
            .then(() => this.callNextAction(cache));
        } else if (role?.edit) {
          role
            .setIcon(buffer, reason)
            .then(() => this.callNextAction(cache))
            .catch((err) => this.displayError(data, cache, err));
        } else {
          this.callNextAction(cache);
        }
      })
      .catch((err) => this.displayError(data, cache, err));
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
