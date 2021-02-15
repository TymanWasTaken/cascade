import { Intents } from "../deps.ts"

/**
 * An "enum" that contains useful intent values (not actually an enum because typescript wouldn't let me do that)
 */
export const IntentUtil = Object.freeze({
	ALL: Object.keys(Intents).filter(k => isNaN(Number(k)) === true) as any,
	NONE: [] as any,
	DEFAULT: Object.keys(Intents).filter(k => isNaN(Number(k)) === true)
				.filter(intent => !["GUILD_MEMBERS", "GUILD_PRESENCES"].includes(intent)) as any
})