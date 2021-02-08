# Setting up

Make sure you have all the pre-requisites listed here:
- [Deno](https://deno.land/)
- [An application with a bot user](https://discord.com/developers/applications/)

Then make a new folder where your code will be.

In this new folder, make a new file. This will be the main file of your bot.
Import the `CascadeClient` like this:
```ts
import { CascadeClient } from "https://deno.land/x/cascade@1.0.3/mod.ts";
```

You then need to create the client and handlers, do that like this
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
    token: 'token here', // the token for your bot user
    commandHandler,
    listenerHandler,
    inhibitorHandler,
    owners: ["put your discord id here"], // this is an array of ids for who is an "owner" of the bot
    verbose: true // Only put this if you want cascade to log a lot of things.
});

client.listenerHandler.setEmitters({ // This sets all the emitters that you can use in your listeners, you can add whatever you want, this is just a recommended default.
  commandHandler,
  listenerHandler,
  inhibitorHandler,
  client
});
```

This sets up the base for your bot and where it all starts. If you run it now, it will error because it can't find the listeners, commands, and inhibitors directories. To fix this, create all of those. the bot should then run.

## Next steps

- [Commands](commands.md)
- [Listeners](listeners.md)
- [Inhibitors](inhibitors.md)