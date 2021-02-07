import {Message} from "https://deno.land/x/discordeno@10.2.0/mod.ts"
import {CascadeCommandParse} from "./CascadeCommandHandler.ts"

export interface CascadeMessage extends Message {
    parse: CascadeCommandParse
}