import * as djs from "discord.js";
import { Actions, ActionsCache } from "../bot.ts";
import Audio from "../bot_audio.ts";
import { Subscription } from "../bot_audio.ts";
import { Action, ActionMod } from "../types.ts";

type SkipQueueData = { amount: string };

export default {
	//---------------------------------------------------------------------
	// Action Name
	//
	// This is the name of the action displayed in the editor.
	//---------------------------------------------------------------------

	name: "Skip Queue",

	//---------------------------------------------------------------------
	// Action Section
	//
	// This is the section the action will fall into.
	//---------------------------------------------------------------------

	section: "Audio Control",

	//---------------------------------------------------------------------
	// Action Subtitle
	//
	// This function generates the subtitle displayed next to the name.
	//---------------------------------------------------------------------

	subtitle(data: SkipQueueData, presets: any) {
		return `Skip ${data.amount} Items`;
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

	meta: { version: "2.2.0", preciseCheck: true, author: null, authorUrl: null, downloadUrl: null },

	//---------------------------------------------------------------------
	// Action Fields
	//
	// These are the fields for the action. These fields are customized
	// by creating elements with corresponding IDs in the HTML. These
	// are also the names of the fields stored in the action's JSON data.
	//---------------------------------------------------------------------

	fields: ["amount"],

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

	html(isEvent: boolean, data: any) {
		return `
<div style="float: left; width: 80%;">
	<span class="dbminputlabel">Amount to Skip</span><br>
	<input id="amount" class="round" value="1">
</div>`;
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

	async action(this: typeof Actions, cache: ActionsCache) {
		const data = cache.actions[cache.index] as Action & SkipQueueData;
		const server = cache.server;
		const subscription: Subscription | null = await Audio.getSubscription(server);
		if (!subscription) {
			this.callNextAction(cache);
			return;
		}

		const amount: number = parseInt(this.evalMessage(data.amount, cache), 10);
		subscription.skip(amount);

		this.callNextAction(cache);
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
} satisfies ActionMod;
