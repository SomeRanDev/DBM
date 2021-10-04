module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Send Message",

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

  subtitle(data, presets) {
    return `${presets.getSendTargetText(data.channel, data.varName)}: "${data.message.replace(/[\n\r]+/, "")}"`;
  },

  //---------------------------------------------------------------------
  // Action Storage Function
  //
  // Stores the relevant variable info for the editor.
  //---------------------------------------------------------------------

  variableStorage(data, varType) {
    const type = parseInt(data.storage, 10);
    if (type !== varType) return;
    return [data.varName2, "Message"];
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: [
    "channel",
    "varName",
    "message",
    "buttons",
    "selectMenus",
    "reply",
    "ephemeral",
    "tts",
    "file",
    "storage",
    "varName2",
  ],

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
<send-target-input selectId="channel" variableInputId="varName"></send-target-input>

<br><br><br>

<tab-system>


  <tab label="Message" icon="align left">
    <div style="padding: 8px;">
      <textarea id="message" class="dbm_monospace" rows="10" placeholder="Insert message here..." style="height: calc(100vh - 298px); white-space: nowrap; resize: none;"></textarea>
    </div>
  </tab>


  <tab label="Buttons" icon="clone">
    <div style="padding: 8px;">

      <dialog-list id="buttons" fields='["name", "type", "id", "url", "emoji", "disabled", "mode", "time", "actions"]' dialogTitle="Button Info" dialogWidth="600" dialogHeight="700" listLabel="Buttons" listStyle="height: calc(100vh - 340px);" itemName="Button" itemCols="4" itemHeight="40px;" itemTextFunction="data.name" itemStyle="text-align: center; line-height: 40px;">
        <div style="padding: 16px;">
          <div style="width: calc(50% - 12px); float: left;">
            <span class="dbminputlabel">Name</span>
            <input id="name" class="round" type="text">

            <br>

            <span class="dbminputlabel">Type</span><br>
            <select id="type" class="round">
              <option value="PRIMARY" selected>Primary (Blurple)</option>
              <option value="SECONDARY">Secondary (Grey)</option>
              <option value="SUCCESS">Success (Green)</option>
              <option value="DANGER">Danger (Red)</option>
              <option value="LINK">Link (Grey)</option>
            </select>

            <br>

            <span class="dbminputlabel">Link URL</span>
            <input id="url" placeholder="Leave blank for none..." class="round" type="text">

            <br>

            <span class="dbminputlabel">Action Response Mode</span><br>
            <select id="mode" class="round">
              <option value="PERSONAL">Temporary, Only for Command User</option>
              <option value="PUBLIC">Temporary, Anyone Can Use</option>
              <option value="PERSISTENT" selected>Persistent (Works After Bot Resets)</option>
            </select>
          </div>
          <div style="width: calc(50% - 12px); float: right;">
            <span class="dbminputlabel">Unique ID</span>
            <input id="id" placeholder="Leave blank to auto-generate..." class="round" type="text">

            <br>

            <span class="dbminputlabel">Action Row (1 - 5)</span>
            <input id="row" placeholder="Leave blank for default..." class="round" type="text">

            <br>

            <span class="dbminputlabel">Emoji</span>
            <input id="emoji" placeholder="Leave blank for none..." class="round" type="text">

            <br>

            <span class="dbminputlabel">Temporary Time-Limit (Miliseconds)</span>
            <input id="time" placeholder="60000" class="round" type="text">
          </div>

          <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>

          <action-list-input id="actions" height="calc(100vh - 460px)"></action-list-input>

        </div>
      </dialog-list>

    </div>
  </tab>


  <tab label="Select Menus" icon="list alternate">
    <div style="padding: 8px;">

      <dialog-list id="selectMenus" fields='["placeholder", "id", "tempVarName", "row", "min", "max", "mode", "time", "options", "actions"]' dialogTitle="Select Menu Info" dialogWidth="800" dialogHeight="700" listLabel="Select Menus" listStyle="height: calc(100vh - 340px);" itemName="Select Menu" itemCols="1" itemHeight="40px;" itemTextFunction="data.placeholder + '<br>' + data.options" itemStyle="text-align: left; line-height: 40px;">
        <div style="padding: 16px;">
          <div style="width: calc(33% - 16px); float: left; margin-right: 16px;">
            <span class="dbminputlabel">Placeholder</span>
            <input id="placeholder" class="round" type="text">

            <br>

            <span class="dbminputlabel">Temp Variable Name</span>
            <input id="tempVarName" placeholder="Stores selected value for actions..." class="round" type="text">

            <br>

            <span class="dbminputlabel">Minimum Select Number</span>
            <input id="min" class="round" type="text" value="1">

            <br>

            <span class="dbminputlabel">Action Response Mode</span><br>
            <select id="mode" class="round">
              <option value="PERSONAL">Temporary, Only for Command User</option>
              <option value="PUBLIC">Temporary, Anyone Can Use</option>
              <option value="PERSISTENT" selected>Persistent (Works After Bot Resets)</option>
            </select>
          </div>
          <div style="width: calc(33% - 16px); float: left; margin-right: 16px;">
            <span class="dbminputlabel">Unique ID</span>
            <input id="id" placeholder="Leave blank to auto-generate..." class="round" type="text">

            <br>

            <span class="dbminputlabel">Action Row (1 - 5)</span>
            <input id="row" placeholder="Leave blank for default..." class="round" type="text">

            <br>

            <span class="dbminputlabel">Maximum Select Number</span>
            <input id="max" class="round" type="text" value="1">

            <br>

            <span class="dbminputlabel">Temporary Time-Limit (Miliseconds)</span>
            <input id="time" placeholder="60000" class="round" type="text">
          </div>
          <div style="width: calc(34% - 8px); height: 300px; float: left; margin-left: 8px;">

            <dialog-list id="options" fields='["label", "description", "value", "emoji", "default"]' dialogTitle="Select Menu Option Info" dialogWidth="360" dialogHeight="440" listLabel="Options" listStyle="height: 210px;" itemName="Option" itemCols="1" itemHeight="20px;" itemTextFunction="data.label" itemStyle="text-align: left; line-height: 20px;">
              <div style="padding: 16px;">
                <span class="dbminputlabel">Name</span>
                <input id="label" class="round" type="text">

                <br>

                <span class="dbminputlabel">Description</span>
                <input id="description" class="round" type="text">

                <br>

                <span class="dbminputlabel">Value</span>
                <input id="value" placeholder="The text passed to the temp variable..." class="round" type="text">

                <br>

                <span class="dbminputlabel">Emoji</span>
                <input id="emoji" placeholder="Leave blank for none..." class="round" type="text">

                <br>

                <span class="dbminputlabel">Default Selected</span><br>
                <select id="default" class="round">
                  <option value="true">Yes</option>
                  <option value="false" selected>No</option>
                </select>
              </div>
            </dialog-list>

          </div>

          <br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>

          <action-list-input id="actions" height="calc(100vh - 460px)">
            <script class="setupTempVars">
              const elem = document.getElementById("tempVarName");
              if(elem?.value) {
                tempVars.push([elem.value, "Text"]);
              }
            </script>
          </action-list-input>

        </div>
      </dialog-list>

    </div>
  </tab>


  <tab label="Settings" icon="cogs">
    <div style="padding: 8px;">
      <dbm-checkbox style="float: left;" id="reply" label="Reply to Interaction if Possible" checked></dbm-checkbox>

      <dbm-checkbox style="float: right;" id="ephemeral" label="Make Reply Private (Ephemeral)"></dbm-checkbox>

      <br><br>

      <dbm-checkbox style="float: left;" id="tts" label="Text-to-Speech"></dbm-checkbox>

      <br><br>

      <div style="padding-top: 12px;">
        <span class="dbminputlabel">Local File Attachment URL</span>
        <input id="file" placeholder="Leave blank for no attachment..." class="round" type="text">
      </div>

      <div style="padding-top: 14px; padding-bottom: 8px;">
        <store-in-variable allowNone selectId="storage" variableInputId="varName2" variableContainerId="varNameContainer2"></store-in-variable>
      </div>

      <br><br>

      <div></div>
    </div>
  </tab>
</tab-system>`;
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
  // Action Editor On Save
  //
  // When the data for the action is saved, this function is called.
  // It provides the ability to modify the final data associated with
  // the action by retrieving it as an argument and returning a modified
  // version through the return value. This can be used to verify the
  // data and fill required entries the user did not.
  //
  // Its inclusion within action mods is optional.
  //---------------------------------------------------------------------

  onSave(data, helpers) {
    // generate unique ids if not provided by user since they are important
    if (Array.isArray(data?.buttons)) {
      for (let i = 0; i < data.buttons.length; i++) {
        if (!data.buttons[i].id) {
          data.buttons[i].id = "msg-button-" + helpers.generateUUID().substring(0, 7);
        }
      }
    }
    if (Array.isArray(data?.selectMenus)) {
      for (let i = 0; i < data.selectMenus.length; i++) {
        if (!data.selectMenus[i].id) {
          data.selectMenus[i].id = "msg-select-" + helpers.generateUUID().substring(0, 7);
        }
      }
    }
    return data;
  },

  //---------------------------------------------------------------------
  // Action Bot Function
  //
  // This is the function for the action within the Bot's Action class.
  // Keep in mind event calls won't have access to the "msg" parameter,
  // so be sure to provide checks for variable existence.
  //---------------------------------------------------------------------

  action(cache) {
    const data = cache.actions[cache.index];
    const channel = parseInt(data.channel, 10);
    const message = data.message;
    if (channel === undefined || message === undefined) return;
    const varName = this.evalMessage(data.varName, cache);
    const target = this.getSendTarget(channel, varName, cache);

    const messageOptions = {
      content: this.evalMessage(message, cache),
    };

    let componentsArr = [];
    let awaitResponses = [];

    const defaultTime = 60000;

    if (Array.isArray(data.buttons)) {
      for (let i = 0; i < data.buttons.length; i++) {
        const button = data.buttons[i];
        const buttonData = this.generateButton(button);
        this.addButtonToActionRowArray(componentsArr, button.row, buttonData, cache);

        if (button.mode !== "PERSISTENT") {
          awaitResponses.push({
            type: "BUTTON",
            time: button.time ? parseInt(button.time) || defaultTime : defaultTime,
            id: button.id,
            user: button.mode === "PERSONAL" ? cache.getUser()?.id : null,
            data: button,
          });
        }
      }
    }

    if (Array.isArray(data.selectMenus)) {
      let selectMenus = [];
      for (let i = 0; i < data.selectMenus.length; i++) {
        const select = data.selectMenus[i];
        const selectData = this.generateSelectMenu(select);
        this.addSelectToActionRowArray(componentsArr, select.row, selectData, cache);

        if (select.mode !== "PERSISTENT") {
          awaitResponses.push({
            type: "SELECT",
            time: select.time ? parseInt(select.time) || defaultTime : defaultTime,
            id: select.id,
            user: select.mode === "PERSONAL" ? cache.getUser()?.id : null,
            data: select,
          });
        }
      }
    }

    if (componentsArr.length > 0) {
      messageOptions.components = componentsArr
        .filter((comps) => comps.length > 0)
        .map(function (comps) {
          return {
            type: "ACTION_ROW",
            components: comps,
          };
        });
    }

    if (data.tts) {
      messageOptions.tts = true;
    }

    if (data.file) {
      messageOptions.files = [data.file];
    }

    const onComplete = (resultMsg) => {
      if (resultMsg) {
        const varName2 = this.evalMessage(data.varName2, cache);
        const storage = parseInt(data.storage, 10);
        this.storeValue(resultMsg, storage, varName2, cache);
        this.callNextAction(cache);

        for (let i = 0; i < awaitResponses.length; i++) {
          const response = awaitResponses[i];
          this.registerTemporaryInteraction(resultMsg.id, response.time, response.id, response.user)
            .then((interaction) => {
              if (response.data) {
                if (response.type === "BUTTON") {
                  this.preformActionsFromInteraction(interaction, response.data, cache.temp);
                } else {
                  this.preformActionsFromSelectInteraction(interaction, response.data, cache.temp);
                }
              }
            })
            .catch((err) => this.displayError(data, cache, err));
        }
      }
    };

    const canReply =
      cache?.interaction?.replied === false && target.id.length > 0 && target.id === cache?.interaction?.channel?.id;

    if (Array.isArray(target)) {
      this.callListFunc(target, "send", [messageOptions]).then(onComplete);
    } else if (data.reply === true && canReply) {
      messageOptions.fetchReply = true;
      if (data.ephemeral === true) {
        messageOptions.ephemeral = true;
      }
      let promise = null;
      if (cache.interaction.deferred) {
        promise = cache.interaction.editReply(messageOptions);
      } else {
        promise = cache.interaction.reply(messageOptions);
      }
      promise.then(onComplete).catch((err) => this.displayError(data, cache, err));
    } else if (target?.send) {
      target
        .send(messageOptions)
        .then(onComplete)
        .catch((err) => this.displayError(data, cache, err));
    } else {
      this.callNextAction(cache);
    }
  },

  //---------------------------------------------------------------------
  // Action Bot Mod Init
  //
  // An optional function for action mods. Upon the bot's initialization,
  // each command/event's actions are iterated through. This is to
  // initialize responses to interactions created within actions
  // (e.g. buttons and select menus for Send Message).
  //
  // If an action provides inputs for more actions within, be sure
  // to call the `this.prepareActions` function to ensure all actions are
  // recursively iterated through.
  //---------------------------------------------------------------------

  modInit(data) {
    if (Array.isArray(data?.buttons)) {
      for (let i = 0; i < data.buttons.length; i++) {
        const button = data.buttons[i];
        if (button.mode === "PERSISTENT") {
          this.registerButtonInteraction(button.id, button);
        }
        this.prepareActions(button.actions);
      }
    }
    if (Array.isArray(data?.selectMenus)) {
      for (let i = 0; i < data.selectMenus.length; i++) {
        const select = data.selectMenus[i];
        if (select.mode === "PERSISTENT") {
          this.registerSelectMenuInteraction(select.id, select);
        }
        this.prepareActions(select.actions);
      }
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
