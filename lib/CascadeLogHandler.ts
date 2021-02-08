import { CascadeClient } from "./CascadeClient.ts";

interface CascadeLogHandlerOptions {
  colors: boolean;
  time: boolean;
}

export enum TermColors {
  Black = "\u001b[30m",
  Red = "\u001b[31m",
  Green = "\u001b[32m",
  Yellow = "\u001b[33m",
  Blue = "\u001b[34m",
  Magenta = "\u001b[35m",
  Cyan = "\u001b[36m",
  White = "\u001b[37m",
  Reset = "\u001b[0m",
}

/**
 * A helper class for logging in cascade.
 */
export class CascadeLogHandler {
  /**
     * The options for this log handler
     */
  public options: CascadeLogHandlerOptions;

  /**
     * The client this handler belongs to
     */
  public client: CascadeClient;

  /**
     * Create the log handler
     * @param options Options for this handler
     */
  public constructor(client: CascadeClient, options: CascadeLogHandlerOptions) {
    this.options = options;
    this.client = client;
  }

  /**
     * Log a message into the console
     * @param message Message to log
     */
  public log(message: string) {
    console.log(message);
  }

  /**
     * Log a message only if in verbose mode
     */
  public verbose(message: string) {
    if (this.client?.verbose) console.log(message);
  }
}
