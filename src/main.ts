import { CommandInteraction, GatewayIntentBits, Events, Collection, Message } from "discord.js"
import * as fs from "fs"
import * as path from "node:path"
import { token, clientId } from "../config.json"

const { Client } = require("discord.js") // to lazy to fix the client.commands problem

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
})

client.commands = new Collection()
const foldersPath = path.join(__dirname, "commands")
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder)
    const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith(".ts"))
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file)
        import(filePath).then((command) => {
            if ("data" in command && "execute" in command) {
                client.commands.set(command.data.name, command)
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
            }
        })
    }
}

client.once(Events.ClientReady, () => {
    console.log("Ready!")
})

client.on(Events.InteractionCreate, async (inter: CommandInteraction) => {
    if (!inter.isChatInputCommand()) return

    const command = client.commands.get(inter.commandName)

    if (!command) return

    await command.execute(inter)
})

client.on(Events.MessageCreate, async (msg: Message) => {
    if (msg.author.id === clientId) return
})

client.login(token) // login the bot
