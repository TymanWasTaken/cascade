import {Message} from "https://deno.land/x/discordeno@10.2.0/mod.ts"
import {CascadeCommandParse} from "./CascadeCommandHandler.ts"

/**
 * An extended interface for Message to add custom properties.
 */
export interface CascadeMessage extends Message {
    /**
     * An opject containing command parse data for this message.
     */
    parse: CascadeCommandParse
}