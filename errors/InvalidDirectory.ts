import { BaseError } from './BaseError.ts'

type dirType = "inhibitor" | "listener" | "command"

export class InvalidDirectoryError extends BaseError {
	constructor(type: dirType) {
		super(`Your ${type} directory doesn't exist!`, new.target.name)
	}
}