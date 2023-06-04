module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Send Image",

  //---------------------------------------------------------------------
  // Action Section
  //
  // This is the section the action will fall into.
  //---------------------------------------------------------------------

  section: "Image Editing",

  //---------------------------------------------------------------------
  // Action Subtitle
  //
  // This function generates the subtitle displayed next to the name.
  //---------------------------------------------------------------------

  subtitle: function (data, presets) {
    return `${presets.getSendTargetText(data.channel, data.varName2)}: ${data.varName}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["storage", "varName", "channel", "varName2", "message", "storage2", "varName3"],

  //---------------------------------------------------------------------
  // Action Storage Function << added
  //
  // Stores the relevant variable info for the editor.
  //---------------------------------------------------------------------

  variableStorage: function (data, varType) {
    const type = parseInt(data.storage2, 10);
    if (type !== varType) return;
    return [data.varName3, "Message"];
  },

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
<retrieve-from-variable dropdownLabel="Source Image" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></retrieve-from-variable>

<br><br><br>

<send-target-input dropdownLabel="Send To" selectId="channel" variableContainerId="varNameContainer2" variableInputId="varName2"></send-target-input>

<br><br><br>

<div style="padding-top: 8px;">
	<span class="dbminputlabel">Message</span><br>
	<textarea id="message" rows="8" placeholder="Insert message here..." style="width: 99%; font-family: monospace; white-space: nowrap; resize: none;"></textarea>
</div>

<br>

<store-in-variable allowNone selectId="storage2" variableInputId="varName3" variableContainerId="varNameContainer3"></store-in-variable>`;
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
    const storage = parseInt(data.storage, 10);
    const varName = this.evalMessage(data.varName, cache);
    const image = this.getVariable(storage, varName, cache);
    if (!image) {
      this.callNextAction(cache);
      return;
    }
    const channel = parseInt(data.channel, 10);
    const varName2 = this.evalMessage(data.varName2, cache);
    const varName3 = this.evalMessage(data.varName3, cache);
    const storage2 = parseInt(data.storage2, 10);
    const target = this.getSendTarget(channel, varName2, cache);
    if (Array.isArray(target)) {
      const Images = this.getDBM().Images;
      Images.createBuffer(image)
        .then(
          function (buffer) {
            this.callListFunc(target, "send", [
              this.evalMessage(data.message, cache),
              {
                files: [
                  {
                    attachment: buffer,
                    name: "image.png",
                  },
                ],
              },
            ])
              .then((msg) => {
                this.storeValue(msg, storage2, varName3, cache);
                this.callNextAction(cache);
              })
              .catch((err) => this.displayError(data, cache, err));
          }.bind(this),
        )
        .catch((err) => this.displayError(data, cache, err));
    } else if (target && target.send) {
      const Images = this.getDBM().Images;
      Images.createBuffer(image)
        .then(
          function (buffer) {
            target
              .send(this.evalMessage(data.message, cache), {
                files: [
                  {
                    attachment: buffer,
                    name: "image.png",
                  },
                ],
              })
              .then((msg) => {
                this.storeValue(msg, storage2, varName3, cache);
                this.callNextAction(cache);
              })
              .catch((err) => this.displayError(data, cache, err));
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
