import { join } from "https://deno.land/std@0.86.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.86.0/fs/mod.ts";
import { Collection } from './Collection.ts'
import { CascadeInhibitor } from './CascadeInhibitor.ts'
import { CascadeClient } from "./CascadeClient.ts";
import { EventEmitter } from "./EventEmitter.ts";
import { CascadeMessage, convertMessage } from "./CascadeMessage.ts";
import { CascadeCommand } from "./CascadeCommand.ts";

/**
 * Options for the inhibitor handler
 */
export interface CascadeInhibitorHandlerOptions {
    /**
     * The directory to look for inhibitors in
     */
    inhibitorDir: string
}

/**
 * The handler used to handle inhibitors/events
 */
export class CascadeInhibitorHandler extends EventEmitter {
    /**
     * The options for this handler
     */
    public options: CascadeInhibitorHandlerOptions
    /**
     * The inhibitors stored for this bot
     */
    public inhibitors: Collection<string, CascadeInhibitor>
    /**
     * The client for this handler
     */
    public client: CascadeClient | null
    /**
     * Creates the handler
     * @param options The options for this handler
     */
    constructor(options: CascadeInhibitorHandlerOptions) {
        super()
        this.options = options
        this.inhibitors = new Collection()
        this.client = null
    }
    /**
     * Initializes the inhibitors in this handler
     */
    public async init() {
        this.inhibitors = new Collection<string, CascadeInhibitor>()
        for await (const inhibitorFile of walk(this.options.inhibitorDir)) {
            if (!inhibitorFile.isFile) continue;
            const cmdPath = join(this.options.inhibitorDir, inhibitorFile.name)
            const inhibitor: CascadeInhibitor = new (await import("file://" + cmdPath)).default()
            
            this.inhibitors.set(inhibitor.options.reason, inhibitor)
        }
        this.emit("loaded")
    }

    /**
     * Checks if the command should run
     * @param message The message
     * @param command The command
     */
    public async checkRun(message: CascadeMessage, command: CascadeCommand): Promise<{ run: boolean; blockedReason?: string; }> {
        for (const inhibitor of this.inhibitors.values()) {
            const result = await inhibitor.exec(message, command)
            if (result == false) {
                return {
                    run: false,
                    blockedReason: inhibitor.options.reason
                }
            }
        }
        return {
            run: true
        }
    }
}