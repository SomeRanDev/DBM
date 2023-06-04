module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Draw Text on Image",

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
    return `${data.text}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["storage", "varName", "x", "y", "font", "width", "text"],

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
<retrieve-from-variable dropdownLabel="Source Image" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName" selectWidth="45%" variableInputWidth="50%"></retrieve-from-variable>

<br><br><br><br>

<div style="float: left; width: 50%;">
	<span class="dbminputlabel">Local Font URL (.fnt)</span><br>
	<input id="font" class="round" type="text" value="fonts/Asimov.fnt"><br>
	<span class="dbminputlabel">X Position</span><br>
	<input id="x" class="round" type="text" value="0"><br>
</div>
<div style="float: right; width: 50%;">
	<span class="dbminputlabel">Max Width</span><br>
	<input id="width" class="round" type="text" placeholder="Leave blank for none!"><br>
	<span class="dbminputlabel">Y Position</span><br>
	<input id="y" class="round" type="text" value="0"><br>
</div>

<br><br><br>

<div>
	<span class="dbminputlabel">Text</span><br>
	<textarea id="text" rows="5" placeholder="Insert text here..." style="width: 99%; white-space: nowrap; resize: none;"></textarea>
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
    const Images = this.getDBM().Images;
    const data = cache.actions[cache.index];
    const storage = parseInt(data.storage, 10);
    const varName = this.evalMessage(data.varName, cache);
    const image = this.getVariable(storage, varName, cache);
    if (!image) {
      this.callNextAction(cache);
      return;
    }
    const fontName = this.evalMessage(data.font, cache);
    const x = parseInt(this.evalMessage(data.x, cache), 10);
    const y = parseInt(this.evalMessage(data.y, cache), 10);
    const width = data.width ? parseInt(this.evalMessage(data.width, cache), 10) : null;
    const text = this.evalMessage(data.text, cache);
    Images.getFont(fontName)
      .then(
        function (font) {
          if (width) {
            image.print(font, x, y, text, width);
          } else {
            image.print(font, x, y, text);
          }
          this.callNextAction(cache);
        }.bind(this),
      )
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

  mod: function () {},
};
