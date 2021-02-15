import { extname, join, resolve, recursiveReaddir } from "../deps.ts";
import { Collection } from '../struct/Collection.ts'
import { CascadeInhibitor } from '../struct/CascadeInhibitor.ts'
import { CascadeClient } from "../struct/CascadeClient.ts";
import { EventEmitter } from "../struct/EventEmitter.ts";
import { CascadeMessage } from "../struct/CascadeMessage.ts";
import { CascadeCommand } from "../struct/CascadeCommand.ts";
import { InvalidDirectoryError } from "../errors/InvalidDirectory.ts";

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
	public client: CascadeClient
	/**
	 * Creates the handler
	 * @param options The options for this handler
	 */
	constructor(client: CascadeClient, options: CascadeInhibitorHandlerOptions) {
		super()
		this.options = options
		this.inhibitors = new Collection()
		this.client = client
	}
	/**
	 * Initializes the inhibitors in this handler
	 */
	public async init() {
		this.inhibitors = new Collection<string, CascadeInhibitor>()
		this.client.logHandler.verbose("[Cascade] Loading inhibitor files")
		try {
			const file = await Deno.stat(this.options.inhibitorDir)
		} catch (e) {
			if (e instanceof Deno.errors.NotFound) {
				throw new InvalidDirectoryError("inhibitor")
			}
			throw new Error(`Unexpected error while stating inhibitor dir: ${e}`)
		}
		const files = (await recursiveReaddir(this.options.inhibitorDir)).map(f => join('.', f)).filter(
			(file: string) => [".js", ".ts"].includes(extname(file))
		)
		this.client.logHandler.verbose("[Cascade] Loaded inhibitor files")
		for await (const inhibitorFile of files) {
			const inhibitorPath = resolve(inhibitorFile)
			const inhibitor: CascadeInhibitor = new (await import("file://" + inhibitorPath)).default()
			
			this.inhibitors.set(inhibitor.options.reason, inhibitor)
		}
		this.client.logHandler.verbose("[Cascade] Loaded inhibitors")
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