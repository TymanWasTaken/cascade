import { CascadeCommandHandler } from './lib/CascadeCommandHandler.ts'

export interface CascadeClientOptions {
    token: string,
    intents?: any,
    commandHandler: CascadeCommandHandler
}
// nothing here yet