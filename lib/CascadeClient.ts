import {startBot} from "https://deno.land/x/discordeno@10.2.0/mod.ts";
import { CascadeCommandHandler } from "./CascadeCommandHandler.ts";
import { CascadeLogHandler } from "./CascadeLogHandler.ts";
import { CascadeMessage } from "./CascadeMessage.ts";

/**
 * The options for this bot
 */
export interface CascadeClientOptions {
    /**
     * The token to use to log into discord with
     */
    token: string,
    /**
     * The intents to use for the bot
     */
    intents?: any,
    /**
     * The command handler to use
     */
    commandHandler: CascadeCommandHandler,
    /**
     * The owner(s) of this bot
     */
    owners: string | string[]
}

/**
 * The main starting point for bots, the client.
 */
export class CascadeClient {
    /**
     * The token of the bot
     */
    public token: string
    /**
     * The intents used for this bot
     */
    public intents: any
    /**
     * The command handler used for this bot
     */
    public commandHandler: CascadeCommandHandler
    /**
     * The log handlher used for this bot
     */
    public logHandler: CascadeLogHandler
    /**
     * The owners of this bot
     */
    public owners: string | string[]

    /**
     * Creats the client
     * @param options The options to use for this bot
     */
    public constructor(options: CascadeClientOptions) {
        this.token = options.token
        this.intents = options.intents || []
        options.commandHandler.init()
        this.commandHandler = options.commandHandler
        this.commandHandler.client = this
        this.logHandler = new CascadeLogHandler({
            time: true,
            colors: true
        })
        this.owners = options.owners
    }

    /**
     * Logs into discord with this client
     */
    public login() {
        const thisClient = this
        startBot({
            token: this.token,
            intents: this.intents,
            eventHandlers: {
                ready() {
                    thisClient.logHandler.log("Logged in!");
                },
                messageCreate: (message) => thisClient.commandHandler.onMessage(message as CascadeMessage)
            }
        });
    }
}