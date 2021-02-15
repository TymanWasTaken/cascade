import { extname, join, resolve, recursiveReaddir } from "../deps.ts";
import { Collection } from '../struct/Collection.ts'
import { CascadeListener } from '../struct/CascadeListener.ts'
import { CascadeClient } from "../struct/CascadeClient.ts";
import { EventEmitter } from "../struct/EventEmitter.ts";
import { convertMessage } from "../struct/CascadeMessage.ts";
import { InvalidDirectoryError } from "../errors/InvalidDirectory.ts";

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
export class CascadeListenerHandler extends EventEmitter {
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
	public client: CascadeClient
	/**
	 * Creates the handler
	 * @param options The options for this handler
	 */
	constructor(client: CascadeClient, options: CascadeListenerHandlerOptions) {
		super()
		this.options = options
		this.listeners = new Collection()
		this.client = client
	}
	/**
	 * Initializes the listeners in this handler
	 */
	public async init(silent: boolean = false) {
		this.listeners.clear()
		if (!this.options.emitters) return
		this.listeners = new Collection<string, CascadeListener>()
		this.client.logHandler.verbose("[Cascade] Loading listener files")
		try {
			const file = await Deno.stat(this.options.listenerDir)
		} catch (e) {
			if (e instanceof Deno.errors.NotFound) {
				throw new InvalidDirectoryError("listener")
			}
			throw new Error(`Unexpected error while stating listener dir: ${e}`)
		}
		const files = (await recursiveReaddir(this.options.listenerDir)).map(f => join('.', f)).filter(
			(file: string) => [".js", ".ts"].includes(extname(file))
		)
		this.client.logHandler.verbose("[Cascade] Loaded listener files")
		for await (const listenerFile of files) {
			const listenerPath = resolve(listenerFile)
			const listener: CascadeListener = new (await import("file://" + listenerPath)).default()
			if (!this.options.emitters[listener.options.emitter]) throw new Error(`${listener.options.emitter} was not a set emitter!`)
			this.options.emitters[listener.options.emitter].on(listener.options.event, (...args: any[]) => {
				this.onEvent(listener.options.emitter, listener.options.event, args)
			})
			this.listeners.set(`${listener.options.emitter}-${listener.options.event}`, listener)
		}
		this.client.logHandler.verbose("[Cascade] Loaded listeners")
		this.emit("loaded")
	}

	/**
	 * Sets the emitters used by this handler
	 * @param emitters The emitters to use for this listener handler
	 */
	public async setEmitters(emitters: Record<string, EventEmitter>) {
		this.options.emitters = emitters
	}

	/**
	 * Handles an event with this handler
	 * @param emitter The emitter for this event
	 * @param event The event emitted
	 * @param params The parameters for this event
	 */
	public async onEvent(emitter: string, event: string, params?: any[]) {
		const handler = this.listeners.get(`${emitter}-${event}`)
		if (handler) {
			// Convert messages to cascade message
			params = params?.map(v => {
				try {
					return ('tts' in v) ? convertMessage(v, this.client as CascadeClient, null) : v
				} catch {
					return v
				}
			})
			if (params) handler.exec(...params)
			else handler.exec()
		}
	}
}