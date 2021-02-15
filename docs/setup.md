# Setting up

Make sure you have all the prerequisites listed here:
- [Deno](https://deno.land/) - Needed to run the bot
- [An application with a bot user](https://discord.com/developers/applications/) - Needed for obivious reasons. If you have not created one yet, make one now and add it to a test server.

Then make a new folder where your code will be.

In this folder, create a file. This will be the main file of your bot.
Import the `CascadeClient` like this:
```ts
import { CascadeClient } from "https://deno.land/x/cascade@1.0.3/mod.ts";
```

You then need to create the client and handlers, as demonstrated below.
```ts
import { 
	CascadeClient,
	CascadeCommandHandler,
	CascadeListenerHandler,
	CascadeInhibitorHandler
} from "https://deno.land/x/cascade@1.0.3/mod.ts";

const commandHandler = new CascadeCommandHandler({
  commandDir: join(Deno.cwd(), "commands"),
  prefix: "prefix here" // The prefix for your bot
});
const listenerHandler = new CascadeListenerHandler({
  listenerDir: join(Deno.cwd(), "listeners"),
});
const inhibitorHandler = new CascadeInhibitorHandler({
  inhibitorDir: join(Deno.cwd(), "inhibitors"),
});

const client = new CascadeClient({
	token: 'token here', // Your bot's token.
	commandHandler,
	listenerHandler,
	inhibitorHandler,
	owners: ["put your discord id here"], // This is an array of IDs containing the "owners" of the bot. Be careful about who you put in here.
	verbose: true // Only put this if you want cascade to log a lot of things.
});

client.listenerHandler.setEmitters({ // This sets all the emitters that you can use in your listeners. You may add whatever you want here, these are just the recommended defaults.
  commandHandler,
  listenerHandler,
  inhibitorHandler,
  client
});
```

This sets up the base for your bot, and is where it all starts. If you run it now, it will throw errors because it can't find the listeners, commands, and inhibitors directories. To fix this, create all of those. Then the bot should then run.

## Next steps

- [Commands](commands.md)
- [Listeners (WIP)](listeners.md)
- [Inhibitors (WIP)](inhibitors.md)