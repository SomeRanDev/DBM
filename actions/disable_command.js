module.exports = {
	//---------------------------------------------------------------------
	// Action Name
	//
	// This is the name of the action displayed in the editor.
	//---------------------------------------------------------------------

	name: "Disable Command",

	//---------------------------------------------------------------------
	// Action Section
	//
	// This is the section the action will fall into.
	//---------------------------------------------------------------------

	section: "Other Stuff",

	//---------------------------------------------------------------------
	// Action Subtitle
	//
	// This function generates the subtitle displayed next to the name.
	//---------------------------------------------------------------------

	subtitle(data, presets) {
		return `${data.disable === "disable" ? "Disable" : "Re-enable"} "${data.command}"`;
	},

	//---------------------------------------------------------------------
	// Action Meta Data
	//
	// Helps check for updates and provides info if a custom mod.
	// If this is a third-party mod, please set "author" and "authorUrl".
	//
	// It's highly recommended "preciseCheck" is set to false for third-party mods.
	// This will make it so the patch version (0.0.X) is not checked.
	//---------------------------------------------------------------------

	meta: { version: "2.0.10", preciseCheck: true, author: null, authorUrl: null, downloadUrl: null },

	//---------------------------------------------------------------------
	// Action Fields
	//
	// These are the fields for the action. These fields are customized
	// by creating elements with corresponding IDs in the HTML. These
	// are also the names of the fields stored in the action's JSON data.
	//---------------------------------------------------------------------

	fields: ["source", "type"],

	//---------------------------------------------------------------------
	// Command HTML
	//
	// This function returns a string containing the HTML used for
	// editing actions.
	//
	// The "isEvent" parameter will be true if this action is being used
	// for an event. Due to their nature, events lack certain information,
	// so edit the HTML to reflect this.
	//---------------------------------------------------------------------

	html(isEvent, data) {
		return `
<tab-system exclusiveTabData retainElementIds spreadOut id="fromTarget">
	<tab label="Disable for User" icon="user" fields='["member", "memberVarName"]'>
		<div style="padding: 8px; margin-bottom: 25px;">
			<member-input dropdownLabel="Member" selectId="member" variableContainerId="memberVarNameContainer" variableInputId="memberVarName"></member-input>
		</div>
		<br>
	</tab>
	<tab label="Disable for Role" icon="fire" fields='["role", "roleVarName"]'>
		<div style="padding: 8px; margin-bottom: 25px;">
			<role-input dropdownLabel="Role" selectId="role" variableContainerId="roleVarNameContainer" variableInputId="roleVarName"></role-input>
		</div>
		<br>
	</tab>
</tab-system>

<br><br><br><br><br><br><br>

<div>
	<span class="dbminputlabel">Command</span><br>
	<select id="command" class="round">
	</select>
</div>

<br>

<div>
	<span class="dbminputlabel">Disable or Re-enable</span><br>
	<select id="disable" class="round">
		<option value="disable" selected>Disable</option>
		<option value="reenable">Re-Enable</option>
	</select>
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
		const { glob, document } = this;

		const $cmds = glob.$cmds;
		const coms = document.getElementById("command");
		let innerHTML = `<option value=""><b> - Current Command - </b></option>\n`;
		for (let i = 0; i < $cmds.length; i++) {
			if ($cmds[i] && $cmds[i].comType >= 4 && $cmds[i].comType <= 6) {
				innerHTML += `<option value="${$cmds[i]._id}">${$cmds[i].name}</option>\n`;
			}
		}
		coms.innerHTML = innerHTML;
	},

	//---------------------------------------------------------------------
	// Action Bot Function
	//
	// This is the function for the action within the Bot's Action class.
	// Keep in mind event calls won't have access to the "msg" parameter,
	// so be sure to provide checks for variable existence.
	//---------------------------------------------------------------------

	action(cache) {
		// TODO
		/*
		const data = cache.actions[cache.index];
		const Files = this.getDBM().Files;

		const id = data.source;
		let actions;
		const allData = Files.data.commands.concat(Files.data.events);
		for (let i = 0; i < allData.length; i++) {
			if (allData[i]?._id === id) {
				actions = allData[i].actions;
				break;
			}
		}

		if (!actions) {
			this.callNextAction(cache);
			return;
		}

		const waitForCompletion = data.type === "true";
		let callback = null;
		if (waitForCompletion) {
			callback = () => this.callNextAction(cache);
		}
		this.executeSubActions(actions, cache, callback);
		if (!waitForCompletion) {
			this.callNextAction(cache);
		}
		*/
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
