# Commands

Every command is in a seperate file, in the `commands` directory (or a different one specified in your CascadeCommandHandlerOptions)

To create a new command, make a new file called whatever you want in your commands directory.

In this file, create an new class extending `CascadeCommand` and make it the default export.
```ts
import { CascadeCommand } from "https://deno.land/x/cascade@1.0.3/mod.ts";

export default class ExampleCommand extends CascadeCommand {

}
```

You then need to create the constructor, which contains the command options like name, aliases, arguments, etc.
```ts
import { CascadeCommand } from "https://deno.land/x/cascade@1.0.3/mod.ts";

export default class ExampleCommand extends CascadeCommand {
	public constructor() {
		super({
			name: 'example', // The name stored in the library, this has no affect on the command parsing.
			aliases: ['example', 'ex'], // This is how the commands are parsed, keep the first value as the main wait to run the command.
			description: {
				content: "An example command.", // The main description text.
				usage: "example <arg1>", // How the command is used, wrap required arguments in <> and optional ones in [].
				examples: [ // An array of example uses that would work with this command
					"example hi",
					"example hello",
				],
			},
			args: [ // An array of arguments for this command
				{
					id: 'arg1', // The name of the argument in your code
					type: 'string' // The type of the arg, see below for a list
				}
			]
		})
	}
}
```

List of currently available argument types:
- string
- number
- user
- channel
- snowflake

Now that you have the options all set up, create the `exec` function, which is what is ran when the command is executed.

```ts
import { CascadeCommand } from "https://deno.land/x/cascade@1.0.3/mod.ts";

export default class ExampleCommand extends CascadeCommand {
	public constructor() {
		super({
			name: 'example',
			aliases: ['example', 'ex'],
			description: {
				content: "An example command.",
				usage: "example <arg1>",
				examples: [
					"example hi",
					"example hello",
				],
			},
			args: [
				{
					id: 'arg1',
					type: 'string'
				}
			],
			userPermissions: ["MANAGE_MESSAGES"] // This specifies the permissions the user needs to run the command, if they are missing it, userMissingPermissions is emitted on commandHandler.
		})
	}
	// CascadeMessage is an extension of Message from discordeno to add extra properties like raw parse data, global flags, and client.
	public async exec(message: CascadeMessage) {
		// Do whatever you want here
	}
}
```

As seen in the code above, `CascadeMessage` is an extension of `Message`. It adds three properties as seen below.
- `CascadeMessage#parse` - Info about how the message was parsed, contains things like alias used and prefix used.
- `CascadeMessage#client` - The curent `CascadeClient` that recievied this message
- `CascadeMessage#globalFlags` - Information about the global flags in this message (no current guide for this, will be made later)