module.exports = {
  //---------------------------------------------------------------------
  // Action Name
  //
  // This is the name of the action displayed in the editor.
  //---------------------------------------------------------------------

  name: "Delete Bulk Messages",

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
    return `Delete ${data.count} messages from ${presets.getChannelText(data.channel, data.varName)}`;
  },

  //---------------------------------------------------------------------
  // Action Fields
  //
  // These are the fields for the action. These fields are customized
  // by creating elements with corresponding Ids in the HTML. These
  // are also the names of the fields stored in the action's JSON data.
  //---------------------------------------------------------------------

  fields: ["channel", "count", "condition", "custom", "varName"],

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
<channel-input dropdownLabel="Source Channel" selectId="channel" variableContainerId="varNameContainer" variableInputId="varName"></channel-input>

<br><br><br>

<div style="padding-top: 8px;">
	<span class="dbminputlabel">Amount to Delete</span><br>
	<input id="count" class="round" type="text" style="width: 90%;"><br>
</div>
<div>
	<div style="float: left; width: 35%;">
		<span class="dbminputlabel">Delete Condition</span><br>
		<select id="condition" class="round" onchange="glob.onChange2(this)">
			<option value="0" selected>None</option>
			<option value="1">Has Author</option>
			<option value="2">Custom</option>
		</select>
	</div>
	<div id="varNameContainer2" style="display: none; float: right; width: 60%;">
		<span class="dbminputlabel">Code</span><br>
		<input id="custom" class="round" type="text"><br>
	</div>
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

    glob.onChange2 = function (event) {
      const value = parseInt(event.value, 10);
      const varNameInput = document.getElementById("varNameContainer2");
      if (value === 0) {
        varNameInput.style.display = "none";
      } else {
        varNameInput.style.display = null;
      }
    };

    glob.onChange2(document.getElementById("condition"));
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
    const server = cache.server;
    let source;
    const channel = parseInt(data.channel, 10);
    const msg = cache.msg;
    const varName = this.evalMessage(data.varName, cache);
    switch (channel) {
      case 0:
        if (msg) {
          source = msg.channel;
        }
        break;
      case 1:
        if (msg && msg.mentions) {
          source = msg.mentions.channels.first();
        }
        break;
      case 2:
        if (server) {
          source = server.channels.cache.first();
        }
        break;
      case 3:
        source = cache.temp[varName];
        break;
      case 4:
        if (server && this.server[server.id]) {
          source = this.server[server.id][varName];
        }
        break;
      case 5:
        source = this.global[varName];
        break;
    }
    if (source?.messages) {
      const count = Math.min(parseInt(this.evalMessage(data.count, cache), 10), 100);
      source.messages
        .fetch({ limit: count, before: msg.id })
        .then(
          function (messages) {
            const condition = parseInt(data.condition, 10);
            if (condition === 1) {
              let author;
              try {
                author = this.eval(data.custom, cache);
              } catch (e) {
                this.displayError(data, cache, e);
                author = null;
              }
              if (author) {
                messages = messages.filter((m) => m.author.id === author.id);
              }
            } else if (condition === 2) {
              const cond = data.custom;
              messages = messages.filter(function (message) {
                let result = false;
                try {
                  result = !!this.eval(cond, cache);
                } catch {}
                return result;
              }, this);
            }
            source
              .bulkDelete(messages)
              .then(() => this.callNextAction(cache))
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

  mod: function (DBM) {},
};
