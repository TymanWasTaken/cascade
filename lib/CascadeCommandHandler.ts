import { join, parse } from "https://deno.land/std@0.86.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.86.0/fs/mod.ts";
import parser from "https://deno.land/x/yargs_parser/deno.ts";

import {Collection, Message} from 'https://deno.land/x/discordeno@10.2.0/mod.ts'
import {CascadeCommand} from './CascadeCommand.ts'
import { Arguments } from "https://deno.land/x/yargs_parser@v20.2.4-deno/build/lib/yargs-parser-types.d.ts";
import { CascadeClient } from "./CascadeClient.ts";
import { CascadeMessage } from "./CascadeMessage.ts";
import { EventEmitter } from "./EventEmitter.ts";

type prefixType = ((message: Message) => string | string[]) | string | string[]

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

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

/**
 * A helper interface for the arguments passed to commands
 */
export interface CascadeCommandArgs {
    [argument: string]: any
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
     * Removes removeText if exists from the left side of the text
     * @param text The text to strip from
     * @param removeText The text to strip
     */
    private rstrip(text: string, removeText: string) {
        const reg = new RegExp(`${escapeRegExp(removeText)}$`)
        return text.replace(reg, '')
    }
    /**
     * Initializes the commands in this handler
     */
    public async init() {
        this.commands = new Collection<string, CascadeCommand>()
        for await (const commandFile of walk(this.options.commandDir)) {
            if (!commandFile.isFile) continue;
            const cmdPath = join(this.options.commandDir, commandFile.name)
            let command = await import("file://" + cmdPath)
            command = new command.default()
            this.commands.set(command.options.name, command)
        }
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
    /**
     * Handles a message with this handler
     * @param message The message to handle
     */
    public async onMessage(message: CascadeMessage) {
        const parse = this.parseCommand(message)
        
        if (parse != null) {
            if (parse.command.options.ownerOnly && !this.isOwner(message.author.id)) {
                this.emit("notOwner", [message])
                return
            }
            message.parse = parse
            message.client = this.client as CascadeClient
            parse.command.exec(message)
        }
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