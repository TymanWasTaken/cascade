import parser from "https://deno.land/x/yargs_parser/deno.ts";
import {Message} from "../deps.ts"

export interface CascadeCommandOptions {
    name: string,
    aliases: string,
    typing: boolean
}

export class CascadeCommand {
    public options: CascadeCommandOptions
    public constructor(options: CascadeCommandOptions) {
        this.options = options
    }

    public async exec(message: Message): Promise<any> {
        // pass
    }
}