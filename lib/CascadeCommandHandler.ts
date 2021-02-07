import { join, parse } from "https://deno.land/std@0.86.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.86.0/fs/mod.ts";
import parser from "https://deno.land/x/yargs_parser/deno.ts";

import {Collection, Message} from 'https://deno.land/x/discordeno@10.2.0/mod.ts'
import {CascadeCommand} from './CascadeCommand.ts'
import { Arguments } from "https://deno.land/x/yargs_parser@v20.2.4-deno/build/lib/yargs-parser-types.d.ts";
import { CascadeClient } from "./CascadeClient.ts";
import { CascadeMessage } from "./CascadeMessage.ts";

type prefixType = ((message: Message) => string | string[]) | string | string[]

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export interface CascadeCommandHandlerOptions {
    commandDir: string,
    prefix: prefixType
}

export interface CascadeCommandArgs {
    [argument: string]: any
}

export interface CascadeCommandParse {
    prefix: string,
    content: string,
    command: CascadeCommand,
    alias: string,
    afterPrefix: string,
    args: Arguments
}

export class CascadeCommandHandler {
    public options: CascadeCommandHandlerOptions
    public commands: Collection<string, CascadeCommand>
    public client: CascadeClient | null
    constructor(options: CascadeCommandHandlerOptions) {
        this.options = options
        this.commands = new Collection()
        this.client = null
    }
    private lstrip(text: string, removeText: string) {
        const reg = new RegExp(`^${escapeRegExp(removeText)}`)
        return text.replace(reg, '')
    }
    private rstrip(text: string, removeText: string) {
        const reg = new RegExp(`${escapeRegExp(removeText)}$`)
        return text.replace(reg, '')
    }
    public async init() {
        this.commands = new Collection<string, CascadeCommand>()
        for await (const commandFile of walk(this.options.commandDir)) {
            if (!commandFile.isFile) continue;
            const cmdPath = join(this.options.commandDir, commandFile.name)
            let command = await import("file://" + cmdPath)
            command = new command.default()
            this.commands.set(command.options.name, command)
        }
    }
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
    public async onMessage(message: CascadeMessage) {
        const parse = this.parseCommand(message)
        
        if (parse != null) {
            if (parse.command.options.ownerOnly && !this.isOwner(message.author.id)) {
                await message.send("You are not an owner!")
            }
            message.parse = parse
            parse.command.exec(message)
        }
    }
    public isOwner(id: string) {
        if (!this.client) return false
        if (typeof this.client.owners == 'string') return this.client.owners == id
        if (Array.isArray(this.client.owners)) return this.client.owners.includes(id)
    }
}