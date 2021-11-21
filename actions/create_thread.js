module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Create Thread",

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

  subtitle(data, presets) {
    return `Create Thread Named "${data.threadName}" from ${presets.getMessageText(data.storage, data.storageVarName)}`;
  },

  //---------------------------------------------------------------------
  // Action Storage Function
  //
  // Stores the relevant variable info for the editor.
  //---------------------------------------------------------------------

  variableStorage(data, varType) {
    const type = parseInt(data.storage, 10);
    if (type !== varType) return;
    return [data.storageVarName, "Thread Channel"];
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding IDs in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["message", "messageVarName", "threadName", "autoArchiveDuration", "reason", "storage", "storageVarName"],

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
<message-input dropdownLabel="Source Message" selectId="message" variableContainerId="varNameContainer" variableInputId="messageVarName"></message-input>

<br><br><br><br>

<div style="float: left; width: calc(50% - 12px);">

  <span class="dbminputlabel">Thread Name</span><br>
  <input id="threadName" class="round" type="text"><br>

</div>
<div style="float: right; width: calc(50% - 12px);">

  <span class="dbminputlabel">Auto-Archive Duration</span><br>
  <select id="autoArchiveDuration" class="round">
    <option value="60" selected>1 hour</option>
    <option value="1440">24 hours</option>
    <option value="4320">3 days (requires boost LVL 1)</option>
    <option value="10080">1 week (requires boost LVL 2)</option>
    <option value="max">Maximum</option>
  </select><br>

</div>

<br><br><br><br>

<hr class="subtlebar" style="margin-top: 0px;">

<br>

<div>
  <span class="dbminputlabel">Reason</span>
  <input id="reason" placeholder="Optional" class="round" type="text">
</div>

<br>

<store-in-variable allowNone selectId="storage" variableInputId="storageVarName" variableContainerId="varNameContainer2"></store-in-variable>`;
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
    const messageVar = parseInt(data.message, 10);
    const messageVarName = this.evalMessage(data.messageVarName, cache);
    const message = this.getMessage(messageVar, messageVarName, cache);

    const threadOptions = {
      name: this.evalMessage(data.threadName, cache),
      autoArchiveDuration: data.autoArchiveDuration === "max" ? "MAX" : parseInt(data.autoArchiveDuration, 10),
    };

    if (data.reason) {
      const reason = this.evalMessage(data.reason, cache);
      threadOptions.reason = reason;
    }

    if (Array.isArray(message)) {
      this.callListFunc(message, "startThread", [threadOptions]).then(() => this.callNextAction(cache));
    } else if (message?.startThread) {
      message
        .startThread(threadOptions)
        .then((threadChannel) => {
          const storage = parseInt(data.storage, 10);
          const storageVarName = this.evalMessage(data.storageVarName, cache);
          this.storeValue(threadChannel, storage, storageVarName, cache);
          this.callNextAction(cache);
        })
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
