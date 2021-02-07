import {startBot} from "https://deno.land/x/discordeno@10.2.0/mod.ts";
import {CascadeClientOptions} from "../mod.ts";
import { CascadeCommandHandler } from "./CascadeCommandHandler.ts";
import { CascadeLogHandler } from "./CascadeLogHandler.ts";
import { CascadeMessage } from "./CascadeMessage.ts";

export class CascadeClient {
    public token: string
    public intents: any
    public commandHandler: CascadeCommandHandler
    public logHandler: CascadeLogHandler
    public owners: string | string[]

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