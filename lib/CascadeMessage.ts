import { Message } from "../deps.ts"
import { CascadeClient } from "./CascadeClient.ts"
import { CascadeCommandParse } from "./CascadeCommandHandler.ts"

export const convertMessage = (message: Message, client: CascadeClient, parse: CascadeCommandParse | null) => {
	const newMessage = message as CascadeMessage
	newMessage.parse = parse
	newMessage.client = client
	return newMessage
}

/**
 * An extended interface for Message to add custom properties.
 */
export interface CascadeMessage extends Message {
	/**
	 * An opject containing command parse data for this message.
	 */
	parse: CascadeCommandParse | null,
	/**
	 * The {CascadeClient} that recieved this message
	 */
	client: CascadeClient,
	/**
	 * The values of the global flags in this message
	 */
	globalFlags?: Record<string, boolean | string>
}