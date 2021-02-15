import { join, extname, recursiveReaddir, Collection, getUser, Message, resolve, parser, memberIDHasPermission } from "../deps.ts";
import { CascadeCommand } from '../struct/CascadeCommand.ts'
import { Arguments } from "https://deno.land/x/yargs_parser@v20.2.4-deno/build/lib/yargs-parser-types.d.ts";
import { CascadeClient } from "../struct/CascadeClient.ts";
import { CascadeMessage, convertMessage } from "../struct/CascadeMessage.ts";
import { EventEmitter } from "../struct/EventEmitter.ts";
import { InvalidDirectoryError } from "../errors/InvalidDirectory.ts";
import { CascadeParseHandler } from "./CascadeParseHandler.ts";

type prefixType = ((message: Message) => string | string[]) | string | string[]

const userMentionReg = /<@!?(?<id>\d{15,20})>/
const channelMentionReg = /<#(?<id>\d{15,20})>/
const snowflakeReg = /\d{15,20}/

export type ArgumentParse = Record<string, unknown>

/**
 * Options for the command handler
 */
export interface CascadeCommandHandlerOptions {
	/**
	 * The directory to look for commands in
	 */
	commandDir: string,
	/**
	 * The prefix to use for messages (can be string, array of strings, or a function returning a string or array of strings)
	 */
	prefix: prefixType,
	/**
	 * The global flags to parse for messages
	 * DO NOT INCLUDE THE -- IN THIS
	 */
	globalFlags?: string[]
}

export interface CascadeCommandArguments {
	[index: number]: {
		id: string,
		type: string,
		match?: 'content'
	};
}

/**
 * The handler used to handle commands/command parsing
 */
export class CascadeCommandHandler extends EventEmitter {
	/**
	 * The options for this handler
	 */
	public options: CascadeCommandHandlerOptions
	/**
	 * The commands stored for this bot
	 */
	public commands: Collection<string, CascadeCommand>
	/**
	 * The client for this handler
	 */
	public client: CascadeClient

	/**
	 * The handler used to parse commands
	 */
	public parseHandler: CascadeParseHandler

	/**
	 * The list of types arguments can be parsed to
	 */
	public static types: Record<string, (text: string, message: CascadeMessage) => Promise<unknown | null> | (unknown | null)> = {
		'string': (text) => {
			return text
		},
		'number': (text) => {
			const num = Number(text)
			return isNaN(num) ? null : num
		},
		'user': async (text, message) => {
			const mentionMatch = text.match(userMentionReg)
			if (mentionMatch) {
				const user = await getUser(mentionMatch.groups?.id as string)
				return user.id == mentionMatch.groups?.id as string ? user : null
			}
			const idMatch = text.match(snowflakeReg)
			if (idMatch) {
				const user = await getUser(text)
				return user.id == text ? user : null
			}
			return null
		},
		'channel': (text, message) => {
			if (!message.guild) return null
			const mentionMatch = text.match(channelMentionReg)
			if (mentionMatch) {
				const channel = message.guild.channels.get(mentionMatch.groups?.id as string)
				return channel ? channel : null
			}
			const snowflakeMatch = text.match(snowflakeReg)
			if (snowflakeMatch) {
				const channel = message.guild.channels.get(text)
				return channel ? channel : null
			}
			const channel = message.guild.channels.find((v) => v.name == text)
			return channel ? channel : null
		},
		'snowflake': (text) => {
			return text.match(snowflakeReg) ? text : null
		}
	}

	/**
	 * Creates the handler
	 * @param options The options for this handler
	 */
	constructor(client: CascadeClient, options: CascadeCommandHandlerOptions) {
		super()
		this.options = options
		this.commands = new Collection()
		this.client = client
		this.parseHandler = new CascadeParseHandler(client)
	}
	/**
	 * Initializes the commands in this handler
	 */
	public async init() {
		this.commands = new Collection<string, CascadeCommand>()
		this.client.logHandler.verbose("[Cascade] Getting command files")
		try {
			const file = await Deno.stat(this.options.commandDir)
		} catch (e) {
			if (e instanceof Deno.errors.NotFound) {
				throw new InvalidDirectoryError("command")
			}
			throw new Error(`Unexpected error while stating command dir: ${e}`)
		}
		const files = (await recursiveReaddir(this.options.commandDir)).map(f => join('.', f)).filter(
			(file: string) => [".js", ".ts"].includes(extname(file))
		)
		this.client.logHandler.verbose("[Cascade] Command Files retrieved")
		for (const commandFile of files) {
			const cmdPath = resolve(commandFile)
			let command = await import("file://" + cmdPath)
			command = new command.default()
			this.commands.set(command.options.name, command)
		}
		this.client.logHandler.verbose("[Cascade] Loaded commands")
		this.emit("loaded")
	}
	/**
	 * Handles a message with this handler
	 * @param message The message to handle
	 */
	public async onMessage(message: CascadeMessage) {
		if (!this.client.ready) return
		const parse = this.parseHandler.parseCommand(message)
		
		if (parse != null) {
			if (parse.command.options.ownerOnly && !this.isOwner(message.author.id)) {
				this.emit("notOwner", [message])
				return
			}
			const msg = convertMessage(message, this.client as CascadeClient, parse)
			if (parse.command.options.guildWhitelist) {
				if (!parse.command.options.guildWhitelist.includes(msg.guildID)) {
					this.emit("guildNotWhitelisted", [message, parse.command])
					return
				}
			}
			const inhibitorCheck = await this.client.inhibitorHandler.checkRun(msg, parse.command)
			if (!inhibitorCheck.run) {
				this.emit("blocked", [inhibitorCheck.blockedReason, message, parse.command])
				return
			}
			if (parse.command.options.userPermissions) {
				for (const permission of parse.command.options.userPermissions) {
					if (!msg.guild) {
						this.emit("notGuild", [msg])
						return
					}
					if (!(await memberIDHasPermission(msg.author.id, msg.guild.id, [permission]))) {
						this.emit("userMissingPermission", [msg, permission])
						return
					}
				}
			}
			const parsedArgs = await this.parseHandler.parseArguments(msg)
			if (!parsedArgs.success) {
				this.emit("argumentFailure", [message, parsedArgs])
				return
			}
			msg.globalFlags = parsedArgs.globalFlags
			parse.command.exec(msg, parsedArgs.parsed)
		}
		this.emit("messageInvalid", [message])
	}
	/**
	 * Checks if a user is an owner
	 * @param id The id of the user
	 */
	public isOwner(id: string) {
		if (!this.client) return false
		if (typeof this.client.owners == 'string') return this.client.owners == id
		if (Array.isArray(this.client.owners)) return this.client.owners.includes(id)
	}
}