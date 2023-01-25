// import hell
const {
	Client,
	GatewayIntentBits,
	Events,
	EmbedBuilder,
	Colors,
	AttachmentBuilder,
	Attachment,
	Partials,
} = require("discord.js")
const StringSimilarity = require("string-similarity")

const Canvas = require("@napi-rs/canvas")

const { token, clientId } = require("./config.json")
const imf = require("./imf.json")
const eternal = require("./eternal.json")

//set up the bot client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Message],
})

// variable for bot
const imfCardName = []
const EternalCardName = []

imf.cards.forEach((c) => {
	imfCardName.push(c.name.toLowerCase())
})
eternal.cards.forEach((c) => {
	EternalCardName.push(c.name.toLowerCase())
})

const specialAttack = {
	green_mox: "Green Mox Power",
	mirror: "Mirror Power",
	ant: "Ant Power",
}

const specialAttackDescription = {
	green_mox:
		"This card's power is the number of creature you control that produce Green Mox",
	mirror: "This card's power is the power of the opposing creature",
	ant: "This card's power is number of ant you control (Cap at 2).",
}

function getEmoji(name) {
	return `<:${
		client.emojis.cache.find((emoji) => emoji.name === name).identifier
	}>`
}

function numToEmoji(num) {
	let out = ""
	for (digit of num + []) {
		if (digit === "-") {
			out += getEmoji("negative")
		} else out += getEmoji(`${digit}_`)
	}
	return out
}

// on ready call
client.once(Events.ClientReady, () => {
	console.log("Ready!")
})

// on commands call
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return // returning everything but commands interaction

	const { commandName, options } = interaction

	if (commandName === "ruleset-code") {
		await interaction.reply(
			"Possible ruleset code for look:\ne: Eternal format"
		)
	}
})

client.on(Events.MessageCreate, async (message) => {
	if (message.author.id === clientId) return

	const m = message.content.match(/([\w]|)\[{2}[^\]]+\]{2}/g)
	if (!m) return

	let embedList = []
	let attachmentList = []

	for (const cn of m) {
		// get important shit
		let cardName = cn.toLowerCase().trim()
		let rulesetNameList = imfCardName
		let ruleset = imf

		// check which ruleset it should be check from
		if (cn.startsWith("e")) {
			cardName = cardName.slice(1)
			rulesetNameList = EternalCardName
			ruleset = eternal
		}
		cardName = cardName.slice(2, cardName.length - 2)
		const bestMatch = StringSimilarity.findBestMatch(
			cardName,
			rulesetNameList
		).bestMatch

		// find the best match
		const card = ruleset.cards.find(
			(c) =>
				c.name.toLowerCase() === bestMatch.target &&
				bestMatch.rating >= 0.4
		)

		// if the card doesn't exist or missing exit and go to the next one
		if (!card) {
			embedList.push(
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle(`Card "${cardName}" not found!`)
					.setDescription(
						`No card found in selected ruleset (${ruleset.ruleset}) that have more than 40% similarity with the search term (${cardName})`
					)
			)
			continue
		}

		// get the card pfp
		const portrait = Canvas.createCanvas(400, 280)
		const context = portrait.getContext("2d")
		const cardPortrait = await Canvas.loadImage(
			`https://github.com/107zxz/inscr-onln/raw/main/gfx/pixport/${card.name.replaceAll(
				" ",
				"%20"
			)}.png`
		)

		//load the pfp
		context.imageSmoothingEnabled = false
		context.drawImage(cardPortrait, 0, 0, portrait.width, portrait.height)
		attachmentList.push(
			new AttachmentBuilder(await portrait.encode("png"), {
				name: `${card.name.replaceAll(" ", "").slice(0, 5)}.png`,
			})
		)

		// generate sigil description
		let sigilDescription = ""
		if (card.sigils) {
			card.sigils.forEach((sigil) => {
				sigilDescription += `**${sigil}**:\n ${ruleset.sigils[sigil]}\n\n`
			})
		}

		// generate the description
		let description = ""

		// bool stuff
		if (card.description) description += `*${card.description}*\n`
		if (card.rare) description += "**Rare**\n"
		if (card.conduit) description += "**Conductive**\n"
		if (card.nosac) description += "**Can't be sacrifice**\n"
		if (card.banned) description += "**Banned**\n"

		// cost stuff
		if (card.blood_cost)
			description += `\n**Blood Cost**: ${getEmoji("blood")}${getEmoji(
				"x_"
			)}${numToEmoji(card.blood_cost)}`

		if (card.bone_cost)
			description += `\n**Bone Cost**: ${getEmoji("bonebone")}${getEmoji(
				"x_"
			)}${numToEmoji(card.bone_cost)}`

		if (card.energy_cost)
			description += `\n**Energy Cost**: ${getEmoji("energy")}${getEmoji(
				"x_"
			)}${numToEmoji(card.energy_cost)}`

		if (card.mox_cost)
			description += `\n**Mox Cost**: ${
				card.mox_cost.includes("Green") ? getEmoji("green") : ""
			}${card.mox_cost.includes("Orange") ? getEmoji("orange") : ""}${
				card.mox_cost.includes("Blue") ? getEmoji("blue") : ""
			}`

		if (
			!card.blood_cost &&
			!card.bone_cost &&
			!card.energy_cost &&
			!card.mox_cost
		)
			description += "\n**Free**"

		// attack and health stuff
		description += `\n\n**Attack**: ${
			card.atkspecial
				? `${specialAttack[card.atkspecial]} (${
						specialAttackDescription[card.atkspecial]
				  })\n`
				: card.attack
		}\n`

		description += `**Health**: ${card.health}\n`

		// other
		if (card.evolution) {
			description += `\n**Change into**: ${card.evolution}\n`
		}

		if (card.left_half)
			description += `\n**This card split into**: ${card.left_half} (Left), ${card.right_half} (Right)\n`
		if (card.sheds) description += `\n**Shed**: ${card.sheds}\n`
		if (card.sigils) description += `\n**Sigils**:\n${sigilDescription}\n`

		embedList.push(
			new EmbedBuilder()
				.setColor(card.rare ? Colors.Green : Colors.Greyple)
				.setTitle(`${card.name} [${ruleset.ruleset}]`)
				.setDescription(description)
				.setThumbnail(
					`attachment://${card.name
						.replaceAll(" ", "")
						.slice(0, 5)}.png`
				)
				.setFooter({
					text: `*This card was selected because it matches ${
						Math.round(bestMatch.rating * 10000) / 100
					}% with the search term (${cardName})*`,
				})
		)
	}

	await message.reply({
		embeds: embedList,
		files: attachmentList,
		allowedMentions: {
			repliedUser: false,
		},
	})
})
client.login(token) // login the bot
