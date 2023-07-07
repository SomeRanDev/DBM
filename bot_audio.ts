/******************************************************
 * Discord Bot Maker Bot - Audio
 * Version 2.2.0
 * Robert Borghese
 ******************************************************/

import { Bot, Files, ActionsCache, MsgType, PrintError, DBMExport } from "./bot.ts";

import * as djs from "discord.js";
import * as djsvoice from "@discordjs/voice";
import * as dplayer from 'discord-player';
import { YoutubeExtractor } from '@discord-player/extractor';

//---------------------------------------------------------------------
//#region Types
// Types for audio-related code.
//---------------------------------------------------------------------

type PlayOptions = {
	volume?: number,
	bitrate?: number,
	seek?: number
}

type PlayInfo = [string, PlayOptions, string];

//#endregion

//---------------------------------------------------------------------
//#region Audio
// The class used for playing audio.
//---------------------------------------------------------------------

@DBMExport()
class Audio {
	static ytdl: typeof import("ytdl-core") | null = null;
	static voice: typeof djsvoice | null = null;
	static player: dplayer.Player | null = null;

	static subscriptions: Map<string, Subscription> = new Map();
	static inlineVolume: boolean | null = null;

	static {
		try {
			Audio.ytdl = require("ytdl-core");
		} catch (e) {
			Audio.ytdl = null;
			console.error(e);
		}

		try {
			Audio.voice = require("@discordjs/voice");
		} catch (e) {
			Audio.voice = null;
			console.error(e);
		}
	}

	static async initPlayer (): Promise<void> {
		this.player = new dplayer.Player(Bot.bot);
		const ytExtractor = await this.player.extractors.register(YoutubeExtractor, {});

		// Doesn't do anything, but keeping it around in case needed in the future.
		this.player.events.on(dplayer.GuildQueueEvent.playerFinish, function() {
			// Event: next track played
		});
	}

	static async connectToVoice (voiceChannel: djs.BaseGuildVoiceChannel): Promise<Subscription | null> {
		if (!this.voice || !this.ytdl) {
			PrintError(MsgType.MISSING_MUSIC_MODULES);
			return null;
		}

		if(!this.player) {
			await this.initPlayer();
		}

		this.inlineVolume ??= (Files.data.settings.mutableVolume ?? "true") === "true";

		var existingSubscription: Subscription | null = this.subscriptions.get(voiceChannel?.guild?.id) ?? null;
		if (existingSubscription) {
			const status = existingSubscription.voiceConnection?.state?.status;
			if (status === this.voice.VoiceConnectionStatus.Disconnected) {
				existingSubscription.voiceConnection.destroy();
				existingSubscription = null;
			} else if (status === this.voice.VoiceConnectionStatus.Destroyed) {
				existingSubscription = null;
			}

			if (existingSubscription?.voiceConnection.joinConfig.channelId === voiceChannel.id) {
				return null;
			}
		}

		const subscription = new Subscription(
			this.voice.joinVoiceChannel({
				adapterCreator: voiceChannel.guild.voiceAdapterCreator,
				channelId: voiceChannel.id,
				guildId: voiceChannel.guildId,
				selfDeaf: (Files.data.settings.autoDeafen ?? "true") === "true",
			}),
			voiceChannel
		);

		this.subscriptions.set(voiceChannel.guildId, subscription);

		return subscription;
	};

	static async getSubscription (guild: djs.Guild): Promise<Subscription | null> {
		const subscription = this.subscriptions.get(guild?.id);
		if (!subscription) {
			const voiceChannel = guild?.members?.me?.voice?.channel;
			if (voiceChannel) {
				return await this.connectToVoice(voiceChannel);
			}
		}
		return subscription ?? null;
	};

	static async disconnectFromVoice (guild: djs.Guild): Promise<void> {
		if (!guild) return;
		const subscription = await this.getSubscription(guild);
		if (!subscription) return;
		subscription.voiceConnection.destroy();
		this.subscriptions.delete(guild?.id);
	};

	static async setVolume (volume: number, guild: djs.Guild): Promise<void> {
		if (this.inlineVolume === false) return PrintError(MsgType.MUTABLE_VOLUME_DISABLED);
		if (!guild) return;
		const subscription = await this.getSubscription(guild);
		if (!subscription) return PrintError(MsgType.MUTABLE_VOLUME_NOT_IN_CHANNEL);

		subscription.queue?.node.setVolume(volume);
	};

	static async addAudio (info: PlayInfo, guild: djs.Guild, addToQueue: boolean) {
		if (!guild) return;
		if (addToQueue) {
			this.addToQueue(info, guild);
		} else {
			this.playImmediately(info, guild);
		}
	};

	static async addToQueue (info: PlayInfo, guild) {
		if (!guild) return;
		const id = guild.id;
		const subscription = await this.getSubscription(guild);
		if (!subscription) return;

		this.play(info, subscription, true);
	};

	static async playImmediately (info: PlayInfo, guild: djs.Guild) {
		if (!guild) return;
		const subscription = await this.getSubscription(guild);
		if (!subscription) return;
		if(!this.player) return;
	
		this.play(info, subscription, false);
	};

	static async play([_, options, url]: PlayInfo, subscription: Subscription, addToQueue: boolean) {
		if(!this.player) return;
		if(!subscription.audioPlayer) return;

		const isPlayable = subscription.channel instanceof djs.VoiceChannel || subscription.channel instanceof djs.StageChannel;
		if(!isPlayable) return;

		type PlayResult = dplayer.PlayerNodeInitializationResult<Subscription>;
		const channel = subscription.channel as djs.VoiceChannel | djs.StageChannel;
		const playResult: PlayResult = await this.player.play(channel, url, {
			nodeOptions: {
				metadata: subscription,
				volume: options.volume,
			},
			audioPlayerOptions: {
				queue: addToQueue,
			},
			connectionOptions: {
				audioPlayer: subscription.audioPlayer,
			}
		});

		if(options.bitrate) {
			playResult.queue.node.setBitrate(options.bitrate);
		}

		subscription.queue = playResult.queue;
	}

	static async clearQueue (cache: ActionsCache) {
		if (!cache.server) return;
		const subscription = await this.getSubscription(cache.server);
		if (!subscription) return;
		subscription.queue?.clear();
	}
}

@DBMExport(Audio)
class Subscription {
	voiceConnection: djsvoice.VoiceConnection;
	channel: djs.BaseGuildVoiceChannel;
	audioPlayer: djsvoice.AudioPlayer | null;
	queue: dplayer.GuildQueue<Subscription> | null;
	volume: number;
	bitrate: number;

	constructor(voiceConnection: djsvoice.VoiceConnection, channel: djs.BaseGuildVoiceChannel) {
		this.voiceConnection = voiceConnection;
		this.channel = channel;
		this.audioPlayer = Audio.voice?.createAudioPlayer() ?? null;
		this.queue = null;
		this.volume = 0.5;
		this.bitrate = 96;

		if(!this.audioPlayer) return;

		this.audioPlayer.on("error", console.error);
		voiceConnection.subscribe(this.audioPlayer);
	}
};

export default Audio;
