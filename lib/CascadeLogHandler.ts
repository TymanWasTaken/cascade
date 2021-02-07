
interface CascadeLogHandlerOptions {
    colors: boolean,
    time: boolean
}

/**
 * A helper class for logging in cascade.
 */
export class CascadeLogHandler {
    /**
     * The options for this log handler
     */
    public options: CascadeLogHandlerOptions

    /**
     * Create the log handler
     * @param options Options for this handler
     */
    public constructor(options: CascadeLogHandlerOptions) {
        this.options = options
    }

    /**
     * Log a message into the console
     * @param message Message to log
     */
    public log(message: string) {
        console.log(message)
    }
}