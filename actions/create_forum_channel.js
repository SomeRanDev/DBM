module.exports = {
	//---------------------------------------------------------------------
	// Action Name
	//
	// This is the name of the action displayed in the editor.
	//---------------------------------------------------------------------

	name: "Create Forum Channel",

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

	subtitle(data) {
		return `${data.channelName}`;
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

	meta: { version: "2.2.0", preciseCheck: true, author: null, authorUrl: null, downloadURL: null },

	//---------------------------------------------------------------------
	// Action Storage Function
	//
	// Stores the relevant variable info for the editor.
	//---------------------------------------------------------------------

	variableStorage(data, varType) {
		const type = parseInt(data.storage, 10);
		if (type !== varType) return;
		return [data.varName, "Channel"];
	},

	//---------------------------------------------------------------------
	// Action Fields
	//
	// These are the fields for the action. These fields are customized
	// by creating elements with corresponding IDs in the HTML. These
	// are also the names of the fields stored in the action's JSON data.
	//---------------------------------------------------------------------

	fields: ["channelName", "topic", "position", "storage", "varName", "categoryID", "slowmodepost", "reason"],

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

	html() {
		return `
<div style="height: 350px; overflow-y: scroll; overflow-x: hidden;">
  <div style="float: left; width: 100%; padding-top: 8px;">
    <span class="dbminputlabel">Name</span>
    <input id="channelName" class="round" type="text">
  </div>

  <div style="float: left; width: 100%; padding-top: 16px;">
    <span class="dbminputlabel">Guidelines</span>
    <textarea id="topic" rows="3" style="font-family: monospace; white-space: nowrap;"></textarea>
  </div>
  
  <div style="float: left; width: 100%;">
    <div style="float: left; width: 60%; padding-top: 16px;">
      <span class="dbminputlabel">Category ID</span>
      <input id= "categoryID" class="round" type="text" placeholder="Leave blank for no category">
    </div>

    <div style="float: right; width: 35%; padding-top: 16px;">
      <span class="dbminputlabel">Position</span>
      <input id="position" class="round" type="text" placeholder="Leave blank for default">
    </div>
  </div>

  <div style="float: left; width: 100%; padding-top: 16px;">
    <span class="dbminputlabel">Slowmode</span><br>
    <input id="slowmodepost" class="round" type="text" placeholder="Leave blank to disable">
  </div>

  <div style="float: left; width: 100%; padding-top: 16px;">
    <span class="dbminputlabel">Reason</span>
    <input id="reason" placeholder="Optional" class="round" type="text">
  </div>

  <div style="float: left; width: 100%; padding-top: 16px;">
    <store-in-variable allowNone dropdownLabel="Store In" selectId="storage" variableContainerId="varNameContainer" variableInputId="varName"></store-in-variable>
  </div>
</div>
`;
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

	async action(cache) {
		const data = cache.actions[cache.index];
		const { server } = cache;

		const channelData = {
			reason: this.evalMessage(data.reason, cache),
			name: this.evalMessage(data.channelName, cache),
		};

		if (data.topic) {
			channelData.topic = this.evalMessage(data.topic, cache);
		}
		if (data.position) {
			channelData.position = parseInt(this.evalMessage(data.position, cache), 10);
		}
		if (data.categoryID) {
			channelData.parent = this.evalMessage(data.categoryID, cache);
		}
		if (data.slowmodepost) {
			channelData.rateLimitPerUser = parseInt(this.evalMessage(data.slowmodepost, cache), 10);
		}
		channelData.type = this.getDBM().DiscordJS.ChannelType.GuildForum;

		server.channels
			.create(channelData)
			.then((channel) => {
				const storage = parseInt(data.storage, 10);
				const varName = this.evalMessage(data.varName, cache);
				this.storeValue(channel, storage, varName, cache);
				this.executeResults(true, data?.branch ?? data, cache);
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
