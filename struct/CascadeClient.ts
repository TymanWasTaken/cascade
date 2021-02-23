import { getUser, startBot, Intents, UserPayload } from "../deps.ts";
import { CascadeCommandHandler, CascadeCommandHandlerOptions } from "../handlers/CascadeCommandHandler.ts";
import { CascadeInhibitorHandler, CascadeInhibitorHandlerOptions } from "../handlers/CascadeInhibitorHandler.ts";
import { CascadeListenerHandler, CascadeListenerHandlerOptions } from "../handlers/CascadeListenerHandler.ts";
import { CascadeLogHandler } from "../handlers/CascadeLogHandler.ts";
import { CascadeMessage } from "./CascadeMessage.ts";
import { EventEmitter } from "./EventEmitter.ts";
import { IntentUtil } from "./IntentUtil.ts";

/**
 * The options for this bot
 */
export interface CascadeClientOptions {
	/**
	 * The token to use to log into discord with
	 */
	token: string,
	/**
	 * The intents to use for the bot
	 */
	intents?: (Intents | keyof typeof Intents)[],
	/**
	 * The command handler to use
	 */
	commandHandlerOptions: CascadeCommandHandlerOptions,
	/**
	 * The listener handler to use
	 */
	listenerHandlerOptions: CascadeListenerHandlerOptions,
	/**
	 * The inhibitor handler to use
	 */
	inhibitorHandlerOptions: CascadeInhibitorHandlerOptions,
	/**
	 * The owner(s) of this bot
	 */
	owners: string | string[],
	/**
	 * Whether or not to verbosely log
	 */
	verbose?: boolean
}

/**
 * The main starting point for bots, the client.
 */
export class CascadeClient extends EventEmitter {
	/**
	 * The token of the bot
	 */
	public token: string
	/**
	 * The intents used for this bot
	 */
	public intents: (Intents | keyof typeof Intents)[]
	/**
	 * The command handler used for this bot
	 */
	public commandHandler: CascadeCommandHandler
	/**
	 * The listener handler used for this bot
	 */
	public listenerHandler: CascadeListenerHandler
	/**
	 * The listener handler used for this bot
	 */
	public inhibitorHandler: CascadeInhibitorHandler
	/**
	 * The log handlher used for this bot
	 */
	public logHandler: CascadeLogHandler
	/**
	 * The owners of this bot
	 */
	public owners: string | string[]
	/**
	 * Whether or not to verbosely log
	 */
	public verbose: boolean
	/**
	 * If this client is ready or not
	 */
	public ready = false

	/**
	 * The user object of this bot. This will be `undefined` before calling CascadeClient#login.
	 */
	public user?: UserPayload

	/**
	 * Creats the client
	 * @param options The options to use for this bot
	 */
	public constructor(options: CascadeClientOptions) {
		super()
		this.token = options.token
		this.intents = options.intents || IntentUtil.DEFAULT
		this.verbose = options.verbose || false
		this.commandHandler = new CascadeCommandHandler(this, options.commandHandlerOptions)
		this.listenerHandler = new CascadeListenerHandler(this, options.listenerHandlerOptions)
		this.inhibitorHandler = new CascadeInhibitorHandler(this, options.inhibitorHandlerOptions)
		this.logHandler = new CascadeLogHandler(this, {
			time: true,
			colors: true
		})
		this.owners = options.owners
		this.listenerHandler.setEmitters({
			client: this,
			commandHandler: this.commandHandler,
			listenerHandler: this.listenerHandler,
			inhibitorHandler: this.inhibitorHandler
		})
	}

	/**
	 * Initializes everything in this handler
	 */
	public async init() {
		await this.listenerHandler.init()
		await this.commandHandler.init()
		await this.inhibitorHandler.init()
	}

	/**
	 * Logs into discord with this client
	 */
	public async login() {
		this.logHandler.verbose("[Cascade] Logging in")
		await startBot({
			token: this.token,
			intents: this.intents,
			eventHandlers: {
				applicationCommandCreate: (...args: unknown[]) => {
					this.emit("applicationCommandCreate", args)
				},
				botUpdate: (...args: unknown[]) => {
					this.emit("botUpdate", args)
				},
				channelCreate: (...args: unknown[]) => {
					this.emit("channelCreate", args)
				},
				channelUpdate: (...args: unknown[]) => {
					this.emit("channelUpdate", args)
				},
				channelDelete: (...args: unknown[]) => {
					this.emit("channelDelete", args)
				},
				debug: (...args: unknown[]) => {
					this.emit("debug", args)
				},
				dispatchRequirements: (...args: unknown[]) => {
					this.emit("dispatchRequirements", args)
				},
				guildBanAdd: (...args: unknown[]) => {
					this.emit("guildBanAdd", args)
				},
				guildBanRemove: (...args: unknown[]) => {
					this.emit("guildBanRemove", args)
				},
				guildCreate: (...args: unknown[]) => {
					this.emit("guildCreate", args)
				},
				guildLoaded: (...args: unknown[]) => {
					this.emit("guildLoaded", args)
				},
				guildUpdate: (...args: unknown[]) => {
					this.emit("guildUpdate", args)
				},
				guildDelete: (...args: unknown[]) => {
					this.emit("guildDelete", args)
				},
				guildEmojisUpdate: (...args: unknown[]) => {
					this.emit("guildEmojisUpdate", args)
				},
				guildMemberAdd: (...args: unknown[]) => {
					this.emit("guildMemberAdd", args)
				},
				guildMemberRemove: (...args: unknown[]) => {
					this.emit("guildMemberRemove", args)
				},
				guildMemberUpdate: (...args: unknown[]) => {
					this.emit("guildMemberUpdate", args)
				},
				heartbeat: (...args: unknown[]) => {
					this.emit("heartbeat", args)
				},
				interactionCreate: (...args: unknown[]) => {
					this.emit("interactionCreate", args)
				},
				messageCreate: (...args: unknown[]) => {
					this.emit("messageCreate", args)
					this.commandHandler.onMessage(args[0] as CascadeMessage)
				},
				messageDelete: (...args: unknown[]) => {
					this.emit("messageDelete", args)
				},
				messageUpdate: (...args: unknown[]) => {
					this.emit("messageUpdate", args)
				},
				nicknameUpdate: (...args: unknown[]) => {
					this.emit("nicknameUpdate", args)
				},
				presenceUpdate: (...args: unknown[]) => {
					this.emit("presenceUpdate", args)
				},
				raw: (...args: unknown[]) => {
					this.emit("raw", args)
				},
				rawGateway: (...args: unknown[]) => {
					this.emit("rawGateway", args)
				},
				ready: (...args: unknown[]) => {
					this.emit("ready", args)
					this.ready = true
					this.logHandler.verbose("[Cascade] Bot ready")
				},
				reactionAdd: (...args: unknown[]) => {
					this.emit("reactionAdd", args)
				},
				reactionRemove: (...args: unknown[]) => {
					this.emit("reactionRemove", args)
				},
				reactionRemoveAll: (...args: unknown[]) => {
					this.emit("reactionRemoveAll", args)
				},
				reactionRemoveEmoji: (...args: unknown[]) => {
					this.emit("reactionRemoveEmoji", args)
				},
				roleCreate: (...args: unknown[]) => {
					this.emit("roleCreate", args)
				},
				roleDelete: (...args: unknown[]) => {
					this.emit("roleDelete", args)
				},
				roleUpdate: (...args: unknown[]) => {
					this.emit("roleUpdate", args)
				},
				roleGained: (...args: unknown[]) => {
					this.emit("roleGained", args)
				},
				roleLost: (...args: unknown[]) => {
					this.emit("roleLost", args)
				},
				shardReady: (...args: unknown[]) => {
					this.emit("shardReady", args)
				},
				typingStart: (...args: unknown[]) => {
					this.emit("typingStart", args)
				},
				voiceChannelJoin: (...args: unknown[]) => {
					this.emit("voiceChannelJoin", args)
				},
				voiceChannelLeave: (...args: unknown[]) => {
					this.emit("voiceChannelLeave", args)
				},
				voiceChannelSwitch: (...args: unknown[]) => {
					this.emit("voiceChannelSwitch", args)
				},
				voiceStateUpdate: (...args: unknown[]) => {
					this.emit("voiceStateUpdate", args)
				},
				webhooksUpdate: (...args: unknown[]) => {
					this.emit("webhooksUpdate", args)
				}
			}
		});
		this.logHandler.verbose("[Cascade] Logged in")
		const botid = (
			await (
				await fetch("https://discord.com/api/v8/oauth2/applications/@me", {
					headers: {
						"Authorization": `Bot ${this.token}`
					}
				})
			).json()
		).id as string
		try {
			this.user = await getUser(botid)
		} catch {
			this.user = undefined
		}
	}
}