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

// // on commands call
// client.on(Events.InteractionCreate, async (interaction) => {
// 	if (!interaction.isChatInputCommand()) return // executing everything but commands interaction

// 	const { commandName, options } = interaction
// 	// if (commandName === "lookup") {
// 	// 	const card = ruleset.cards.find(
// 	// 		(c) =>
// 	// 			c.name ===
// 	// 				StringSimilarity.findBestMatch(cardName, cardNameList)
// 	// 					.bestMatch.target &&
// 	// 			StringSimilarity.findBestMatch(cardName, cardNameList).bestMatch
// 	// 				.rating >= 0.4
// 	// 	)

// 	// 	if (!card) {
// 	// 		await interaction.reply("Card not found")
// 	// 		return
// 	// 	}
// 	// 	const portrait = Canvas.createCanvas(400, 280)
// 	// 	const context = portrait.getContext("2d")
// 	// 	const cardPortrait = await Canvas.loadImage(
// 	// 		`https://github.com/107zxz/inscr-onln/raw/main/gfx/pixport/${card.name.replaceAll(
// 	// 			" ",
// 	// 			"%20"
// 	// 		)}.png`
// 	// 	)

// 	// 	context.imageSmoothingEnabled = false
// 	// 	context.drawImage(cardPortrait, 0, 0, portrait.width, portrait.height)
// 	// 	const attachment = new AttachmentBuilder(await portrait.encode("png"), {
// 	// 		name: "pfp.png",
// 	// 	})
// 	// 	context.filter = console.log()
// 	// 	await interaction.reply({
// 	// 		embeds: [
// 	// 			new EmbedBuilder()
// 	// 				.setColor(Colors.Green)
// 	// 				.setTitle(card.name)
// 	// 				.setDescription(
// 	// 					`${
// 	// 						card.description !== undefined
// 	// 							? `*${card.description}*\n\n`
// 	// 							: ""
// 	// 					}${card.rare ? "**Rare**\n" : ""}${
// 	// 						card.blood_cost > 0
// 	// 							? `**Blood Cost**: ${card.blood_cost}\n`
// 	// 							: ""
// 	// 					}${
// 	// 						card.bone_cost > 0
// 	// 							? `**Bone Cost**: ${card.bone_cost}\n`
// 	// 							: ""
// 	// 					}${
// 	// 						card.energy_cost > 0
// 	// 							? `**Energy Cost**: ${card.energy_cost}\n`
// 	// 							: ""
// 	// 					}${
// 	// 						card.mox_cost > 0
// 	// 							? `**Mox Cost**: ${card.mox_cost.join(", ")}\n`
// 	// 							: ""
// 	// 					}\n**Attack**: ${card.attack}\n**Health**: ${
// 	// 						card.health
// 	// 					}\n${
// 	// 						card.sigils
// 	// 							? `\n**Sigil**: ${card.sigils.join(", ")}\n`
// 	// 							: ""
// 	// 					}\n${card.nosac ? "**Can't be sacrifice**\n" : ""}${
// 	// 						card.banned ? "**Banned**" : ""
// 	// 					}`
// 	// 				)
// 	// 				.setThumbnail(`attachment://pfp.png`),
// 	// 		],
// 	// 		files: [attachment],
// 	// 	})
// 	// }
// })

client.on(Events.MessageCreate, async (message) => {
	if (message.author.id === clientId) return

	console.log(!message.content.match(/(\w|)\[{2}[^\]]+\]{2}/g))

	const m = message.content.match(/(\w|)\[{2}[^\]]+\]{2}/g)
	if (!m) return

	let embedList = []
	let attachmentList = []

	for (const cn of m) {
	
		// get important shit
		let cardName
		let rulesetNameList
		let ruleset

		cardName = cn.toLowerCase()
		// check which ruleset it should be check from
		if (cn.startsWith("e")) {
			cardName = cardName.slice(1).replaceAll("[[", "").replaceAll("]]", "")
			rulesetNameList = EternalCardName
			ruleset = eternal
		} else {
			cardName = cardName.replaceAll("[[", "").replaceAll("]]", "")
			rulesetNameList = imfCardName
			ruleset = imf
		}
		console.log(
			StringSimilarity.findBestMatch(cardName, rulesetNameList).bestMatch
		)
		// find the best match
		const card = ruleset.cards.find(
			(c) =>
				c.name.toLowerCase() ===
					StringSimilarity.findBestMatch(cardName, rulesetNameList)
						.bestMatch.target &&
				StringSimilarity.findBestMatch(cardName, rulesetNameList)
					.bestMatch.rating >= 0.5
		)

		// if the card doesn't exist or missing exit and go to the next one
		if (!card) {
			embedList.push(
				new EmbedBuilder()
					.setTitle(`Card "${cardName}" not found!`)
					.setDescription(`This card doesn't exist in the selected ruleset (${ruleset.ruleset})`)
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
		if (card.description) description += `*${card.description}*\n\n`
		if (card.rare) description += "**Rare**\n\n"
		if (card.conduit) description += "**Conductive**\n\n"

		// cost stuff
		if (card.blood_cost)
			description += `**Blood Cost**: ${getEmoji("blood")}${getEmoji(
				"x_"
			)}${numToEmoji(card.blood_cost)}\n`

		if (card.bone_cost)
			description += `**Bone Cost**: ${getEmoji("bonebone")}${getEmoji(
				"x_"
			)}${numToEmoji(card.bone_cost)}\n`

		if (card.energy_cost)
			description += `**Energy Cost**: ${getEmoji("energy")}${getEmoji(
				"x_"
			)}${numToEmoji(card.energy_cost)}\n`

		if (card.mox_cost)
			description += `**Mox Cost**: ${
				card.mox_cost.includes("Green") ? getEmoji("green") : ""
			}${card.mox_cost.includes("Orange") ? getEmoji("orange") : ""}${
				card.mox_cost.includes("Blue") ? getEmoji("blue") : ""
			}\n`

		if (
			!card.blood_cost &&
			!card.bone_cost &&
			!card.energy_cost &&
			!card.mox_cost
		)
			description += "**Free**\n"
		// attack and health stuff
		description += `\n**Attack**: ${
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

		if (card.sheds) description += `\n**Shed**: ${card.sheds}\n`
		if (card.sigils) description += `\n**Sigils**:\n${sigilDescription}\n`
		if (card.nosac) description += "\n**Can't be sacrifice**\n"
		if (card.banned) description += "\n**Banned**"

		embedList.push(
			new EmbedBuilder()
				.setColor(card.rare ? Colors.Red : Colors.Greyple)
				.setTitle(`${card.name} [${ruleset.ruleset}]`)
				.setDescription(description)
				.setThumbnail(
					`attachment://${card.name
						.replaceAll(" ", "")
						.slice(0, 5)}.png`
				)
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
