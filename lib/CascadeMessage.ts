import {Message} from "https://deno.land/x/discordeno@10.2.0/mod.ts"
import { CascadeClient } from "./CascadeClient.ts"
import {CascadeCommandParse} from "./CascadeCommandHandler.ts"

/**
 * An extended interface for Message to add custom properties.
 */
export interface CascadeMessage extends Message {
    /**
     * An opject containing command parse data for this message.
     */
    parse: CascadeCommandParse,
    /**
     * The {CascadeClient} that recieved this message
     */
    client: CascadeClient
}