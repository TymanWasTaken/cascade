import {CascadeMessage} from "./CascadeMessage.ts";

/**
 * The options for a cascade command
 */
export interface CascadeCommandOptions {
    /**
     * The name of this command
     */
    name: string,
    /**
     * The aliases of this command (make sure the first value is the main alias to call this command)
     */
    aliases: string[],
    /**
     * If the bot should type as the command is running
     * @default false
     */
    typing?: boolean,
    /**
     * If the command should only run for owners of the bot
     * @default false
     */
    ownerOnly?: boolean
}

/**
 * A command for the bot to use
 */
export class CascadeCommand {
    /**
     * The options for this command
     */
    public options: CascadeCommandOptions
    /**
     * Creates the command
     * @param options The options to use for this command, THIS MUST BE GIVEN DESPITE IT BEING OPTIONAL
     */
    public constructor(options?: CascadeCommandOptions) {
        if (options) {
            this.options = options
        } else {
            throw new Error("Must specify options!")
        }
    }

    /**
     * Ran on command sent by user
     * @param message The message sent
     */
    public async exec(message: CascadeMessage): Promise<any> {
        // pass
    }
}