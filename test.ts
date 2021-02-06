import {CascadeClient} from "./lib/CascadeClient.ts";

const client = new CascadeClient({
    token: JSON.parse(await Deno.readTextFile("./test_config.json")).token,
    intents: ["GUILDS", "GUILD_MESSAGES"]
})

client.login()