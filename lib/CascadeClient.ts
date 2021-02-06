import {startBot} from "../deps.ts";
import {CascadeClientOptions} from "../mod.ts";

export class CascadeClient {
    public token: string
    public intents: any

    public constructor(options: CascadeClientOptions) {
        this.token = options.token
        this.intents = options.intents || []
    }

    public login() {
        startBot({
            token: this.token,
            intents: this.intents,
            eventHandlers: {
                ready() {
                    console.log("Logged in!");
                },
                messageCreate(message) {
                    if (message.content === "!ping") {
                        message.reply("Pong using Discordeno!");
                    }
                }
            }
        });
    }
}