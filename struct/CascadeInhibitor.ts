import { CascadeCommand } from './CascadeCommand.ts'
import { CascadeMessage } from './CascadeMessage.ts'

/**
 * The options for a cascade inhibitor
 */
export interface CascadeInhibitorOptions {
	/**
	 * The reason to emit when emitting commandHandler#blocked
	 */
	reason: string
}

/**
 * A inhibitor for the bot to use
 */
export class CascadeInhibitor {
	/**
	 * The options for this inhibitor
	 */
	public options: CascadeInhibitorOptions
	
	/**
	 * Creates the inhibitor
	 * @param options The options to use for this inhibitor, THIS MUST BE GIVEN DESPITE IT BEING OPTIONAL
	 */
	public constructor(options?: CascadeInhibitorOptions) {
		if (options) {
			this.options = options
		} else {
			throw new Error("Must specify options!")
		}
	}

	/**
	 * Ran on commands, must return true or false
	 * True: command should run
	 * False: command should be blocked
	 * @param message The message sent
	 * @param command The command to be run
	 * @returns True or false based on if the command should run or not
	 */
	// deno-lint-ignore require-await
	public async exec(message: CascadeMessage, command: CascadeCommand): Promise<boolean> {
		return true
	}
}