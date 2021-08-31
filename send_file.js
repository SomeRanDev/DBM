module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Send File",

  //---------------------------------------------------------------------
  // Action Section
  //
  // This is the section the action will fall into.
  //---------------------------------------------------------------------

  section: "Messaging",

  //---------------------------------------------------------------------
  // Action Subtitle
  //
  // This function generates the subtitle displayed next to the name.
  //---------------------------------------------------------------------

  subtitle: function (data, presets) {
    const channels = presets.sendTargets;
    return `${channels[parseInt(data.channel, 10)]}: "${data.message.replace(/[\n\r]+/, "")}"`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["channel", "varName", "file", "message"],

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
<send-target-input isEvent=${isEvent} dropdownLabel="Send To" selectId="channel" variableContainerId="varNameContainer" variableInputId="varName"></send-target-input>

<br><br><br>

<div style="padding-top: 8px;">
	<span class="dbminputlabel">Local File URL</span><br>
	<input id="file" class="round" type="text" value="resources/"><br>
</div>

<div>
	<span class="dbminputlabel">Message</span><br>
	<textarea id="message" rows="8" placeholder="Insert message here..." style="width: 99%; font-family: monospace; white-space: nowrap; resize: none;"></textarea>
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
    const channel = parseInt(data.channel, 10);
    const message = data.message;
    if (channel === undefined || message === undefined) return;
    const varName = this.evalMessage(data.varName, cache);
    const target = this.getSendTarget(channel, varName, cache);
    const options = {
      files: [this.getLocalFile(this.evalMessage(data.file, cache))],
    };
    if (Array.isArray(target)) {
      this.callListFunc(target, "send", [this.evalMessage(message, cache), options]).then(() =>
        this.callNextAction(cache),
      );
    } else if (target && target.send) {
      try {
        target
          .send(this.evalMessage(message, cache), options)
          .then(() => this.callNextAction(cache))
          .catch((err) => this.displayError(data, cache, err));
      } catch (e) {
        this.displayError(data, cache, e);
      }
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