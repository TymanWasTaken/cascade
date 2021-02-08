import { join, extname } from "https://deno.land/std@0.86.0/path/mod.ts";
import parser from "https://deno.land/x/yargs_parser/deno.ts";
import { recursiveReaddir } from "https://deno.land/x/recursive_readdir/mod.ts";
import {Collection, getUser, Message} from 'https://deno.land/x/discordeno@10.2.0/mod.ts'
import {CascadeCommand} from './CascadeCommand.ts'
import { Arguments } from "https://deno.land/x/yargs_parser@v20.2.4-deno/build/lib/yargs-parser-types.d.ts";
import { CascadeClient } from "./CascadeClient.ts";
import { CascadeMessage, convertMessage } from "./CascadeMessage.ts";
import { EventEmitter } from "./EventEmitter.ts";
import { resolve } from "https://deno.land/std@0.86.0/path/win32.ts";
import { TermColors } from "./CascadeLogHandler.ts";

type prefixType = ((message: Message) => string | string[]) | string | string[]

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

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
    prefix: prefixType
}

export interface CascadeCommandArguments {
    [index: number]: {
        id: string,
        type: string,
        match?: 'content'
    };
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
     * The raw yargs parse of the message
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
    problemArg?: {
        id: string,
        type: string,
        match?: 'content'
    }
    parsed?: Record<string, unknown>
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
    public client: CascadeClient | null

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
    constructor(options: CascadeCommandHandlerOptions) {
        super()
        this.options = options
        this.commands = new Collection()
        this.client = null
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
     * Initializes the commands in this handler
     */
    public async init() {
        this.commands = new Collection<string, CascadeCommand>()
        console.log("[Cascade] Getting command files")
        const files = (await recursiveReaddir(this.options.commandDir)).map(f => join('.', f)).filter(
            (file: string) => [".js", ".ts"].includes(extname(file))
        )
        console.log("[Cascade] Command Files retrieved")
        for (const commandFile of files) {
            const cmdPath = resolve(commandFile)
            let command = await import("file://" + cmdPath)
            command = new command.default()
            this.commands.set(command.options.name, command)
        }
        console.log("[Cascade] Loaded commands")
        this.emit("loaded")
    }
    /**
     * Parses command data from a message
     * @param message Message to parse from
     */
    public parseCommand(message: Message): CascadeCommandParse | null {
        let prefixes: prefixType
        if (typeof this.options.prefix == "function") {
            prefixes = this.options.prefix(message)
        } else {
            prefixes = this.options.prefix
        }
        if (Array.isArray(prefixes)) {
            for (const p of prefixes) {
                for (const command of this.commands.values()) {
                    for (const alias of command.options.aliases) {
                        if (!message.content.startsWith(p + alias)) continue
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
        }
        else if (typeof prefixes == "string") {
            const p = prefixes
            for (const command of this.commands.values()) {
                for (const alias of command.options.aliases) {
                    if (!message.content.startsWith(p + alias)) continue
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
        const parse = message.parse as CascadeCommandParse
        const normal: {
            id: string,
            type: string,
            match?: 'content'
        }[] = [];
        const flags: {
            id: string,
            type: string,
            match?: 'content'
        }[] = [];
        const content: {
            id: string,
            type: string,
            match?: 'content'
        }[] = [];
        ((parse.command.options.args) as {
            id: string,
            type: string,
            match?: 'content'
        }[]).forEach(arg => {
            if (arg.type == 'flag') return flags.push(arg)
            else if (arg.match == 'content') return content.push(arg)
            else return normal.push(arg)
        })
        let i = 0
        for (const arg of normal) {
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
        for (const flag of flags) {
            if (!parse.args[flag.id]) {
                return {
                    success: false,
                    reason: ArgFailReason.MISSING,
                    problemArg: flag
                }
            }
            parsedArgs[flag.id] = parse.args[flag.id]
        }
        for (const contentArg of content) {
            const parsed = await CascadeCommandHandler.types[contentArg.type](parse.content, message)
            parsedArgs[contentArg.id] = parsed
        }
        return {
            success: true,
            parsed: parsedArgs
        }
    }
    /**
     * Handles a message with this handler
     * @param message The message to handle
     */
    public async onMessage(message: CascadeMessage) {
        if (!this.client?.ready) return
        const parse = this.parseCommand(message)
        
        if (parse != null) {
            if (parse.command.options.ownerOnly && !this.isOwner(message.author.id)) {
                this.emit("notOwner", [message])
                return
            }
            const msg = convertMessage(message, this.client as CascadeClient, parse)
            if (parse.command.options.guildWhitelist?.includes(msg.guildID)) {
                const inhibitorCheck = await this.client.inhibitorHandler.checkRun(msg, parse.command)
                if (!inhibitorCheck.run) {
                    this.emit("blocked", [inhibitorCheck.blockedReason, message, parse.command])
                    return
                }
                const parsedArgs = await this.parseArguments(msg)
                if (!parsedArgs.success) {
                    await message.reply("Failure parsing args")
                    console.log(parsedArgs)
                    return
                }
                parse.command.exec(msg, parsedArgs.parsed)
            } else {
                this.emit("guildNotWhitelisted", [message, parse.command])
                return
            }
            
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