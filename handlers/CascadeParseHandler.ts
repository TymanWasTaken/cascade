import { Arguments } from "https://deno.land/x/yargs_parser@v20.2.4-deno/build/lib/yargs-parser-types.d.ts"
import { Message, parser } from "../deps.ts"
import { CascadeClient } from "../struct/CascadeClient.ts"
import { CascadeCommand } from "../struct/CascadeCommand.ts"
import { CascadeMessage } from "../struct/CascadeMessage.ts"
import { 
	CascadeCommandHandler, 
	CascadeCommandArguments, 
	CascadeFlagArgument,
	CascadeCommandArgument
} from "./CascadeCommandHandler.ts"

type prefixType = ((message: Message) => string | string[]) | string | string[]

function escapeRegExp(string: string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * An interface to store raw parsed message data
 */
export interface CascadeCommandParse {
	/**
	 * The prefix used for this message
	 */
	prefix: string,
	/**
	 * Everything after the prefix and command
	 */
	content: string,
	/**
	 * The command used
	 */
	command: CascadeCommand,
	/**
	 * The alias used for the command
	 */
	alias: string,
	/**
	 * Everything after the prefix
	 */
	afterPrefix: string,
	/**
	 * The raw yargs parse of the message or null if no arguments
	 */
	args: Arguments
}

export enum ArgFailReason {
	INCORRECT_TYPE = "INCORRECT_TYPE",
	INVALID_TYPE = "INVALID_TYPE",
	MISSING = "MISSING"
}

export interface CascadeCommandArgParse {
	success: boolean,
	reason?: ArgFailReason,
	problemArg?: CascadeCommandArgument
	parsed?: Record<string, unknown>,
	globalFlags?: Record<string, boolean | string>
}

export class CascadeParseHandler {
	public client: CascadeClient

	public constructor(client: CascadeClient) {
		this.client = client
	}

	/**
	 * Removes removeText if exists from the left side of the text
	 * @param text The text to strip from
	 * @param removeText The text to strip
	 */
	private lstrip(text: string, removeText: string) {
		const reg = new RegExp(`^${escapeRegExp(removeText)}`)
		return text.replace(reg, '')
	}

	/**
	 * Parses command data from a message
	 * @param message Message to parse from
	 */
	public parseCommand(message: Message): CascadeCommandParse | null {
		let prefixes: prefixType
		if (typeof this.client.commandHandler.options.prefix == "function") {
			prefixes = this.client.commandHandler.options.prefix(message)
		} else {
			prefixes = this.client.commandHandler.options.prefix
		}
		if (typeof prefixes == "string") prefixes = [prefixes]
		for (const p of prefixes) {
			for (const command of this.client.commandHandler.commands.values()) {
				for (const alias of command.options.aliases) {
					const cmdReg = new RegExp(`^${escapeRegExp(p + alias)}(?: ?$|(?: \\w+)(?: \\w+)*)`)
					if (!message.content.match(cmdReg)) continue
					if (message.content.match(new RegExp(`^${escapeRegExp(p + alias)} ?$`))) {
						return {
							alias,
							prefix: p,
							content: "",
							command: command,
							afterPrefix: "",
							args: { _: [] } // Yargs parse for empty string
						}
					}
					const afterPrefix = this.lstrip(this.lstrip(message.content, p + alias), ' ')
					return {
						alias: this.lstrip(message.content, p).replace(/ .*$/, ''),
						prefix: p,
						content: this.lstrip(this.lstrip(message.content, p + alias), ' '),
						command: command,
						afterPrefix,
						args: parser(afterPrefix)
					}
				}
			}
		}
		return null
	}
	public async parseArguments(message: CascadeMessage): Promise<CascadeCommandArgParse> {
		const parsedArgs: Record<string, unknown> = {}
		const globalParsedFlags: Record<string, boolean | string> = {}
		const parse = message.parse as CascadeCommandParse
		const normal: CascadeCommandArguments = [];
		const flags: CascadeCommandArguments = [];
		const content: CascadeCommandArguments = [];
		((parse.command.options.args) as CascadeCommandArguments).forEach(arg => {
			if (typeof arg.type != 'string') return flags.push(arg)
			else if (arg.match == 'content') return content.push(arg)
			else return normal.push(arg)
		})
		let i = 0
		for (const normalArg of normal) {
			const arg = normalArg as {
				id: string,
				type: string,
				match?: 'content'
			}
			if (!CascadeCommandHandler.types[arg.type]) {
				return {
					success: false,
					reason: ArgFailReason.INVALID_TYPE,
					problemArg: arg
				}
			}
			const parsed = await CascadeCommandHandler.types[arg.type](String(parse.args._[i]), message)
			if (parsed == null) {
				return {
					success: false,
					reason: ArgFailReason.INCORRECT_TYPE,
					problemArg: arg
				}
			}
			parsedArgs[arg.id] = parsed
			i++
		}
		for (const flagArg of flags) {
			const flag = flagArg as {
				id: string,
				type: CascadeFlagArgument,
				match?: 'content'
			}
			if (!parse.args[flag.id]) {
				parsedArgs[flag.id] = flag.type.default
			} else {
				parsedArgs[flag.id] = parse.args[flag.id]
			}
		}
		for (const contentArg of content) {
			const arg = contentArg as {
				type: string,
				id: string,
				match: 'content'
			}
			const parsed = await CascadeCommandHandler.types[arg.type](parse.content, message)
			parsedArgs[contentArg.id] = parsed
		}
		if (this.client.commandHandler.options.globalFlags) {
			for (const globalFlag of this.client.commandHandler.options.globalFlags) {
				globalParsedFlags[globalFlag] = parse.args[globalFlag]
			}
		}
		return {
			success: true,
			parsed: parsedArgs,
			globalFlags: globalParsedFlags
		}
	}
}