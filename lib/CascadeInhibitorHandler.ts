import {
  extname,
  join,
  resolve,
} from "https://deno.land/std@0.86.0/path/mod.ts";
import { Collection } from "./Collection.ts";
import { CascadeInhibitor } from "./CascadeInhibitor.ts";
import { CascadeClient } from "./CascadeClient.ts";
import { EventEmitter } from "./EventEmitter.ts";
import { CascadeMessage } from "./CascadeMessage.ts";
import { CascadeCommand } from "./CascadeCommand.ts";
import { recursiveReaddir } from "https://deno.land/x/recursive_readdir@v2.0.0/mod.ts";
import { TermColors } from "./CascadeLogHandler.ts";

/**
 * Options for the inhibitor handler
 */
export interface CascadeInhibitorHandlerOptions {
  /**
     * The directory to look for inhibitors in
     */
  inhibitorDir: string;
}

/**
 * The handler used to handle inhibitors/events
 */
export class CascadeInhibitorHandler extends EventEmitter {
  /**
     * The options for this handler
     */
  public options: CascadeInhibitorHandlerOptions;
  /**
     * The inhibitors stored for this bot
     */
  public inhibitors: Collection<string, CascadeInhibitor>;
  /**
     * The client for this handler
     */
  public client: CascadeClient | null;
  /**
     * Creates the handler
     * @param options The options for this handler
     */
  constructor(options: CascadeInhibitorHandlerOptions) {
    super();
    this.options = options;
    this.inhibitors = new Collection();
    this.client = null;
  }
  /**
     * Initializes the inhibitors in this handler
     */
  public async init() {
    this.inhibitors = new Collection<string, CascadeInhibitor>();
    console.log("[Cascade] Loading inhibitor files");
    const files = (await recursiveReaddir(this.options.inhibitorDir)).map((f) =>
      join(".", f)
    ).filter(
      (file: string) => [".js", ".ts"].includes(extname(file)),
    );
    console.log("[Cascade] Loaded inhibitor files");
    for await (const inhibitorFile of files) {
      const inhibitorPath = resolve(inhibitorFile);
      const inhibitor: CascadeInhibitor =
        new (await import("file://" + inhibitorPath)).default();

      this.inhibitors.set(inhibitor.options.reason, inhibitor);
    }
    console.log("[Cascade] Loaded inhibitors");
    this.emit("loaded");
  }

  /**
     * Checks if the command should run
     * @param message The message
     * @param command The command
     */
  public async checkRun(
    message: CascadeMessage,
    command: CascadeCommand,
  ): Promise<{ run: boolean; blockedReason?: string }> {
    for (const inhibitor of this.inhibitors.values()) {
      const result = await inhibitor.exec(message, command);
      if (result == false) {
        return {
          run: false,
          blockedReason: inhibitor.options.reason,
        };
      }
    }
    return {
      run: true,
    };
  }
}
