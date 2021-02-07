import { Collection } from "./Collection.ts";

type EventHandler = (...args: any[]) => void

export class EventEmitter {
    public registeredEvents: Collection<string, EventHandler> = new Collection()
    public on(event: string, handler: EventHandler) {
        this.registeredEvents.set(event, handler)
    }
    public once(event: string, handler: EventHandler) {
        this.registeredEvents.set("once-" + event, handler)
    }
    public emit(event: string, ...args: any[]) {
        if (this.registeredEvents.has("once-" + event)) {
            const handler = this.registeredEvents.get("once-" + event)
            if (handler) handler(args)
            this.registeredEvents.delete("once-" + event)
        }
        else if (this.registeredEvents.has(event)) {
            const handler = this.registeredEvents.get(event)
            if (handler) handler(args)
        }
    }
}