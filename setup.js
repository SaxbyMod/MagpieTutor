const { REST, Routes, SlashCommandBuilder } = require("discord.js")
const {
	clientId,
	guildId,
	token,
	betaToken,
	betaClientId,
} = require("./config.json")

const t = token
const c = clientId
const commands = [
	new SlashCommandBuilder()
		.setName("set-code")
		.setDescription("Show all the set code"),
	new SlashCommandBuilder()
		.setName("ping")
		.setDescription(
			"If the bot response pong it online and should be working"
		),
	new SlashCommandBuilder()
		.setName("restart")
		.setDescription("Force the bot to reset"),
	new SlashCommandBuilder()
		.setName("draft")
		.setDescription("Open packs and draft a deck")
		.addStringOption((option) =>
			option
				.setName("set")
				.setDescription("Which set do you want to pull card from")
				.setChoices(
					{
						name: "Competitive",
						value: "competitive",
					},
					{ name: "Eternal", value: "eternal" },
					{ name: "Vanilla", value: "vanilla" }
				)
				.setRequired(true)
		)
		.addIntegerOption((option) =>
			option
				.setName("size")
				.setDescription(
					"The deck size (how many pack do you want to open)"
				)
				.setMinValue(10)
				.setMaxValue(30)
		)
		.addBooleanOption((option) =>
			option
				.setName("beast")
				.setDescription(
					"Exclude Beast (card that cost Blood) card when drafting"
				)
		)
		.addBooleanOption((option) =>
			option
				.setName("undead")
				.setDescription(
					"Exclude Undead (card that cost Bone) card when drafting"
				)
		)
		.addBooleanOption((option) =>
			option
				.setName("tech")
				.setDescription(
					"Exclude Tech (card that cost Energy) card when drafting"
				)
		)
		.addBooleanOption((option) =>
			option
				.setName("magick")
				.setDescription(
					"Exclude Magick (card that cost Mox) card when drafting"
				)
		),
].map((command) => command.toJSON())

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(t)

//deploy your commands!
;(async () => {
	try {
		console.log(
			`Started refreshing ${commands.length} application (/) commands.`
		)

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(Routes.applicationCommands(c), {
			body: commands,
		})

		console.log(
			`Successfully reloaded ${data.length} application (/) commands.`
		)
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error)
	}
})()
