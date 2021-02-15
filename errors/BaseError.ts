export class BaseError extends Error {
	constructor(message: string, errorName: string) {
        super(message); // 'Error' breaks prototype chain here
        this.name = errorName;
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
    }
}