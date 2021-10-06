module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Remove Buttons and Selects",

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
    return `${presets.getMessageText(data.storage, data.varName)}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["storage", "varName", "type", "searchValue"],

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
<message-input dropdownLabel="Source Message" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></message-input>

<br><br><br><br>

<div style="float: left; width: calc(50% - 12px);">
  <span class="dbminputlabel">Components to Remove</span><br>
  <select id="type" class="round" onchange="glob.onButtonSelectTypeChange(this)">
    <option value="all" selected>All Buttons and Select Menus</option>
    <option value="allButtons">All Buttons</option>
    <option value="allSelects">All Select Menus</option>
    <option value="sourceButton">Source Button</option>
    <option value="sourceSelect">Source Select Menu</option>
    <option value="findButton">Specific Button</option>
    <option value="findSelect">Specific Select Menu</option>
  </select>
</div>

<div id="nameContainer" style="float: right; width: calc(50% - 12px);">
  <span class="dbminputlabel">Component Label/ID</span><br>
  <input id="searchValue" class="round" type="text">
</div>`;
  },

  //---------------------------------------------------------------------
  // Action Editor Init Code
  //
  // When the HTML is first applied to the action editor, this code
  // is also run. This helps add modifications or setup reactionary
  // functions for the DOM elements.
  //---------------------------------------------------------------------

  init() {
    const { glob } = this;

    glob.onButtonSelectTypeChange = function (event) {
      const input = document.getElementById("nameContainer");
      input.style.display = event.value === "findButton" || event.value === "findSelect" ? null : "none";
    };

    glob.onButtonSelectTypeChange(document.getElementById("type"));
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
    const storage = parseInt(data.storage, 10);
    const varName = this.evalMessage(data.varName, cache);
    const message = this.getMessage(storage, varName, cache);

    const type = data.type;

    let sourceButton = null;
    if (cache.interaction.isButton()) {
      sourceButton = cache.interaction.customId;
    }

    let sourceSelect = null;
    if (cache.interaction.isSelectMenu()) {
      sourceSelect = cache.interaction.customId;
    }

    let components = null;

    let searchValue = null;

    if (type === "all") {
      components = [];
    } else if (message?.components) {
      const oldComponents = message.components;
      const newComponents = [];
      for (let i = 0; i < oldComponents.length; i++) {
        const comps = oldComponents[i].toJSON();
        const newComps = [];
        for (let j = 0; j < comps.components.length; j++) {
          const comp = comps.components[j];
          switch (type) {
            case "allButtons": {
              if (comp.type !== 2) newComps.push(comp);
              break;
            }
            case "allSelects": {
              if (comp.type !== 3) newComps.push(comp);
              break;
            }
            case "sourceButton": {
              if (comp.custom_id !== sourceButton) newComps.push(comp);
              break;
            }
            case "sourceSelect": {
              if (comp.custom_id !== sourceSelect) newComps.push(comp);
              break;
            }
            case "findButton":
            case "findSelect": {
              if (searchValue === null) searchValue = this.evalMessage(data.searchValue, cache);
              if (comp.custom_id !== searchValue && comp.label !== searchValue) newComps.push(comp);
              break;
            }
          }
        }
        comps.components = newComps;
        if (newComps.length > 0) newComponents.push(comps);
      }
      components = newComponents;
    }

    if (components) {
      if (Array.isArray(message)) {
        this.callListFunc(message, "edit", [{ components }]).then(() => this.callNextAction(cache));
      } else if (message?.edit) {
        message
          .edit({ components })
          .then(() => this.callNextAction(cache))
          .catch((err) => this.displayError(data, cache, err));
      } else {
        this.callNextAction(cache);
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

  mod() {},
};
