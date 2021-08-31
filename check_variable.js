module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Check Variable",

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

  subtitle: function (data) {
    const results = ["Continue Actions", "Stop Action Sequence", "Jump To Action", "Jump Forward Actions"];
    return `If True: ${results[parseInt(data.iftrue, 10)]} ~ If False: ${results[parseInt(data.iffalse, 10)]}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["storage", "varName", "comparison", "value", "iftrue", "iftrueVal", "iffalse", "iffalseVal"],

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
<retrieve-from-variable dropdownLabel="Variable" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></retrieve-from-variable>

<br><br><br>

<div style="padding-top: 8px;">
	<div style="float: left; width: 45%;">
		<span class="dbminputlabel">Comparison Type</span><br>
		<select id="comparison" class="round" onchange="glob.onChange1(this)">
			<option value="0">Exists</option>
			<option value="1" selected>Equals</option>
			<option value="2">Equals Exactly</option>
			<option value="3">Less Than</option>
			<option value="4">Greater Than</option>
			<option value="5">Includes</option>
			<option value="6">Matches Regex</option>
		</select>
	</div>
	<div style="float: right; width: 50%;" id="directValue">
		<span class="dbminputlabel">Value to Compare to</span><br>
		<input id="value" class="round" type="text" name="is-eval">
	</div>
</div>

<br><br><br>

<div style="padding-top: 8px;">
	${data.conditions[0]}
</div>`;
  },

  //---------------------------------------------------------------------
  // Action Editor Init Code
  //
  // When the HTML is first applied to the action editor, this code
  // is also run. This helps add modifications or setup reactionary
  // functions for the DOM elements.
  //---------------------------------------------------------------------

  init: function () {
    const { glob, document } = this;

    glob.onChange1 = function (event) {
      if (event.value === "0") {
        document.getElementById("directValue").style.display = "none";
      } else {
        document.getElementById("directValue").style.display = null;
      }
    };

    glob.onChangeTrue(document.getElementById("iftrue"));
    glob.onChangeFalse(document.getElementById("iffalse"));
  },

  //---------------------------------------------------------------------
  // Action Bot Function
  //
  // This is the function for the action within the Bot's Action class.
  // Keep in mind event calls won't have access to the "msg" parameter,
  // so be sure to provide checks for variable existence.
  //---------------------------------------------------------------------

  action: function (cache) {
    const data = cache.actions[cache.index];
    const type = parseInt(data.storage, 10);
    const varName = this.evalMessage(data.varName, cache);
    const variable = this.getVariable(type, varName, cache);
    let result = false;
    if (variable) {
      const val1 = variable;
      const compare = parseInt(data.comparison, 10);
      let val2 = this.evalMessage(data.value, cache);
      if (compare !== 6) val2 = this.eval(val2, cache);
      if (val2 === false) val2 = this.evalMessage(data.value, cache);
      switch (compare) {
        case 0:
          result = val1 !== undefined;
          break;
        case 1:
          result = val1 == val2;
          break;
        case 2:
          result = val1 === val2;
          break;
        case 3:
          result = val1 < val2;
          break;
        case 4:
          result = val1 > val2;
          break;
        case 5:
          if (typeof val1.includes === "function") {
            result = val1.includes(val2);
          }
          break;
        case 6:
          result = Boolean(val1.match(new RegExp("^" + val2 + "$", "i")));
          break;
      }
    }
    this.executeResults(result, data, cache);
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