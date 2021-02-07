import { Application, Channel, startBot, UserPayload } from "https://deno.land/x/discordeno@10.2.0/mod.ts";
import { Intents } from "https://deno.land/x/discordeno@10.2.0/mod.ts"
import { CascadeCommandHandler } from "./CascadeCommandHandler.ts";
import { CascadeListenerHandler } from "./CascadeListenerHandler.ts";
import { CascadeLogHandler } from "./CascadeLogHandler.ts";
import { CascadeMessage } from "./CascadeMessage.ts";
import { IntentUtil } from "./IntentUtil.ts";

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
    intents?: (Intents | keyof typeof Intents)[],
    /**
     * The command handler to use
     */
    commandHandler: CascadeCommandHandler,
    /**
     * The listener handler to use
     */
    listenerHandler: CascadeListenerHandler,
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
    public intents: (Intents | keyof typeof Intents)[]
    /**
     * The command handler used for this bot
     */
    public commandHandler: CascadeCommandHandler
    /**
     * The listener handler used for this bot
     */
    public listenerHandler: CascadeListenerHandler
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
        this.intents = options.intents || IntentUtil.DEFAULT
        options.commandHandler.init()
        options.listenerHandler.init()
        this.commandHandler = options.commandHandler
        this.listenerHandler = options.listenerHandler
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
                applicationCommandCreate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "applicationCommandCreate", args)
                },
                botUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "botUpdate", args)
                },
                channelCreate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "channelCreate", args)
                },
                channelUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "channelUpdate", args)
                },
                channelDelete(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "channelDelete", args)
                },
                debug(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "debug", args)
                },
                dispatchRequirements(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "dispatchRequirements", args)
                },
                guildBanAdd(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildBanAdd", args)
                },
                guildBanRemove(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildBanRemove", args)
                },
                guildCreate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildCreate", args)
                },
                guildLoaded(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildLoaded", args)
                },
                guildUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildUpdate", args)
                },
                guildDelete(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildDelete", args)
                },
                guildEmojisUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildEmojisUpdate", args)
                },
                guildMemberAdd(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildMemberAdd", args)
                },
                guildMemberRemove(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildMemberRemove", args)
                },
                guildMemberUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "guildMemberUpdate", args)
                },
                heartbeat(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "heartbeat", args)
                },
                interactionCreate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "interactionCreate", args)
                },
                messageCreate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "messageCreate", args)
                    thisClient.commandHandler.onMessage(args[0] as CascadeMessage)
                },
                messageDelete(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "messageDelete", args)
                },
                messageUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "messageUpdate", args)
                },
                nicknameUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "nicknameUpdate", args)
                },
                presenceUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "presenceUpdate", args)
                },
                raw(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "raw", args)
                },
                rawGateway(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "rawGateway", args)
                },
                ready(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "ready", args)
                },
                reactionAdd(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "reactionAdd", args)
                },
                reactionRemove(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "reactionRemove", args)
                },
                reactionRemoveAll(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "reactionRemoveAll", args)
                },
                reactionRemoveEmoji(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "reactionRemoveEmoji", args)
                },
                roleCreate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "roleCreate", args)
                },
                roleDelete(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "roleDelete", args)
                },
                roleUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "roleUpdate", args)
                },
                roleGained(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "roleGained", args)
                },
                roleLost(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "roleLost", args)
                },
                shardReady(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "shardReady", args)
                },
                typingStart(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "typingStart", args)
                },
                voiceChannelJoin(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "voiceChannelJoin", args)
                },
                voiceChannelLeave(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "voiceChannelLeave", args)
                },
                voiceChannelSwitch(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "voiceChannelSwitch", args)
                },
                voiceStateUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "voiceStateUpdate", args)
                },
                webhooksUpdate(...args: any[]) {
                    thisClient.listenerHandler.onEvent("client", "webhooksUpdate", args)
                }
            }
        });
    }
}