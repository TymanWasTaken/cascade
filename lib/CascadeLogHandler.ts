
interface CascadeLogHandlerOptions {
    colors: boolean,
    time: boolean
}

export class CascadeLogHandler {
    public options: CascadeLogHandlerOptions
    public constructor(options: CascadeLogHandlerOptions) {
        this.options = options
    }
    public log(message: string) {
        console.log(message)
    }
}