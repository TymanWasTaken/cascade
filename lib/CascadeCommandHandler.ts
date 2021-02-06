import { DenoStdInternalError } from "https://deno.land/std@0.83.0/_util/assert.ts"
import {Message} from '../deps.ts'
import {CascadeCommand} from './CascadeCommand.ts'

type prefixType = ((message: Message) => string | string[]) | string | string[]

export interface CascadeCommandHandlerOptions {
    commandDir: string,
    prefix: prefixType
}

export class CascadeCommandHandler {
    public options: CascadeCommandHandlerOptions
    public commands: Map<string, CascadeCommand>
    constructor(options: CascadeCommandHandlerOptions) {
        this.options = options
    }
    public async init() {
        const commandFiles = await Deno.readDir(this.options.commandDir)
        this.commands = new Map<string, CascadeCommand>()
        for await (const commandFile of commandFiles) {
            
        }
    }
}