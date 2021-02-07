import { CascadeCommandHandler } from './lib/CascadeCommandHandler.ts'

export interface CascadeClientOptions {
    token: string,
    intents?: any,
    commandHandler: CascadeCommandHandler,
    owners: string | string[]
}
// nothing here yet