import { join } from "https://deno.land/std@0.86.0/path/mod.ts";
import { walk } from "https://deno.land/std@0.86.0/fs/mod.ts";
import { Collection } from './Collection.ts'
import { CascadeListener } from './CascadeListener.ts'
import { CascadeClient } from "./CascadeClient.ts";
import { EventEmitter } from "./EventEmitter.ts";

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

/**
 * Options for the listener handler
 */
export interface CascadeListenerHandlerOptions {
    /**
     * The directory to look for listeners in
     */
    listenerDir: string,
    /**
     * The emitters for this handler
     */
    emitters?: Record<string, EventEmitter>
}

/**
 * The handler used to handle listeners/events
 */
export class CascadeListenerHandler {
    /**
     * The options for this handler
     */
    public options: CascadeListenerHandlerOptions
    /**
     * The listeners stored for this bot
     */
    public listeners: Collection<string, CascadeListener>
    /**
     * The client for this handler
     */
    public client: CascadeClient | null
    /**
     * Creates the handler
     * @param options The options for this handler
     */
    constructor(options: CascadeListenerHandlerOptions) {
        this.options = options
        this.listeners = new Collection()
        this.client = null
    }
    /**
     * Initializes the listeners in this handler
     */
    public async init() {
        this.listeners.clear()
        if (!this.options.emitters) return
        this.listeners = new Collection<string, CascadeListener>()
        for await (const listenerFile of walk(this.options.listenerDir)) {
            if (!listenerFile.isFile) continue;
            const cmdPath = join(this.options.listenerDir, listenerFile.name)
            const listener: CascadeListener = new (await import("file://" + cmdPath)).default()
            if (!this.options.emitters[listener.options.emitter]) throw new Error(`${listener.options.emitter} was not a set emitter!`)
            this.options.emitters[listener.options.emitter].on(listener.options.event, (...args: any[]) => {
                this.onEvent(listener.options.emitter, listener.options.event, args)
            })
            this.listeners.set(`${listener.options.emitter}-${listener.options.event}`, listener)
        }
    }

    public async setEmitters(emitters: Record<string, EventEmitter>) {
        this.options.emitters = emitters
        this.init()
    }

    /**
     * Handles an event with this handler
     * @param emitter The emitter for this event
     * @param event The event emitted
     * @param params The parameters for this event
     */
    public async onEvent(emitter: string, event: string, params: any[]) {
        const handler = this.listeners.get(`${emitter}-${event}`)
        if (handler) {
            handler.exec(...params)
        }
    }
}