import parser from "https://deno.land/x/yargs_parser/deno.ts";
import {Message} from "https://deno.land/x/discordeno@10.2.0/mod.ts"

export interface CascadeCommandOptions {
    name: string,
    aliases: string[],
    typing?: boolean,
    ownerOnly?: boolean
}

export class CascadeCommand {
    public options: CascadeCommandOptions
    public constructor(options?: CascadeCommandOptions) {
        if (options) {
            this.options = options
        } else {
            throw new Error("Must specify options!")
        }
    }

    public async exec(message: Message): Promise<any> {
        // pass
    }
}