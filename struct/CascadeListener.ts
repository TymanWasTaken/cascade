/**
 * The options for a cascade listener
 */
export interface CascadeListenerOptions {
	/**
	 * The emitter of this listener
	 */
	emitter: string,
	/**
	 * The event of this listener
	 */
	event: string
}

/**
 * A listener for the bot to use
 */
export class CascadeListener {
	/**
	 * The options for this listener
	 */
	public options: CascadeListenerOptions
	
	/**
	 * Creates the listener
	 * @param options The options to use for this listener, THIS MUST BE GIVEN DESPITE IT BEING OPTIONAL
	 */
	public constructor(options?: CascadeListenerOptions) {
		if (options) {
			this.options = options
		} else {
			throw new Error("Must specify options!")
		}
	}

	/**
	 * Ran on the event specified in the options
	 * @param params The parameters the event was sent with
	 */
	public async exec(...params: any[]): Promise<any> {
		// pass
	}
}