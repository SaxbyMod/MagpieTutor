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
	ActionRowBuilder,
	ComponentType,
	StringSelectMenuBuilder,
} = require("discord.js")
const StringSimilarity = require("string-similarity")

const Canvas = require("@napi-rs/canvas")

const { betaToken, token, clientId } = require("./config.json")

const t = token
//set up the bot client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Message],
})

// stuff for bot

const randomChoice = (list) => {
	return list[Math.floor(Math.random() * list.length)]
}

const randomChoices = (list, num) => {
	let out = []
	for (choice = 0; choice < num; choice++) {
		out.push(list[Math.floor(Math.random() * list.length)])
	}
	return out
}

const listDiff = (list1, list2) => list1.filter((x) => !list2.includes(x))
const listInter = (list1, list2) => list1.filter((x) => list2.includes(x))

//define the ruleset shit
const setList = { comp: "competitive", e: "eternal", v: "vanilla" }
let setsData = {}
let setsCardPool = {}
let setsBanPool = {}
let setsRarePool = {}

let setsBeastPool = {}
let setsUndeadPool = {}
let setsTechPool = {}
let setsMagickPool = {}

//downloading all the set and fetch important shit
;(async () => {
	for (const set of Object.values(setList)) {
		console.log(`Set ${set} loaded!`)
		await fetch(
			`https://raw.githubusercontent.com/107zxz/inscr-onln-ruleset/main/${set}.json`
		)
			.then((res) => res.json())
			.then((json) => {
				setsData[set] = json
			})
	}

	// loading all the card pool
	for (const setCode of Object.values(setList)) {
		setsCardPool[setCode] = []
		setsBanPool[setCode] = []
		setsRarePool[setCode] = []
		setsBeastPool[setCode] = []
		setsUndeadPool[setCode] = []
		setsTechPool[setCode] = []
		setsMagickPool[setCode] = []

		for (card of setsData[setCode].cards) {
			const name = card.name.toLowerCase()

			setsCardPool[setCode].push(name)

			if (card.banned) {
				setsBanPool[setCode].push(name)
			}

			if (card.rare) {
				setsRarePool[setCode].push(name)
			}

			if (card.blood_cost) {
				setsBeastPool[setCode].push(name)
			}
			if (card.bone_cost) {
				setsUndeadPool[setCode].push(name)
			}
			if (card.energy_cost) {
				setsTechPool[setCode].push(name)
			}
			if (card.mox_cost) {
				setsMagickPool[setCode].push(name)
			}
		}
	}
})()

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

async function genCardEmbed(rawName) {
	// get important shit
	let name = rawName.toLowerCase().trim()
	let selectedSet = "competitive"

	// check which ruleset it should be check from
	for (code of Object.keys(setList)) {
		if (name.startsWith(code)) {
			name = name.slice(1)
			selectedSet = setList[code]
		}
	}

	let setPool = setsCardPool[selectedSet]
	let set = setsData[selectedSet]

	// format the name
	name = name.slice(2, name.length - 2)

	// get the best match
	const bestMatch = StringSimilarity.findBestMatch(name, setPool).bestMatch

	// find the best match in the ruleset file selected
	const card = set.cards.find(
		(c) =>
			c.name.toLowerCase() === bestMatch.target && bestMatch.rating >= 0.4
	)

	// if the card doesn't exist or missing exit and go to the next one
	if (!card) {
		return (
			new EmbedBuilder()
				.setColor(Colors.Red)
				.setTitle(`Card "${name}" not found`)
				.setDescription(
					`No card found in selected set (${set.ruleset}) that have more than 40% similarity with the search term(${name})`
				),
			-1
		)
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

	// generate sigil description
	let sigilDescription = ""
	if (card.sigils) {
		card.sigils.forEach((sigil) => {
			sigilDescription += `**${sigil}**:\n ${set.sigils[sigil]}\n\n`
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

	return [
		new EmbedBuilder()
			.setColor(card.rare ? Colors.Green : Colors.Greyple)
			.setTitle(`${card.name} [${set.ruleset}]`)
			.setDescription(description)
			.setThumbnail(
				`attachment://${card.name.replaceAll(" ", "").slice(0, 5)}.png`
			)
			.setFooter({
				text: `*This card was selected because it matches ${
					Math.round(bestMatch.rating * 10000) / 100
				}% with the search term (${name})*`,
			}),
		new AttachmentBuilder(await portrait.encode("png"), {
			name: `${card.name.replaceAll(" ", "").slice(0, 5)}.png`,
		}),
	]
}

// on ready call
client.once(Events.ClientReady, () => {
	console.log("Ready!")
})

// on commands call
client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return // returning everything but commands interaction

	const { commandName, options } = interaction

	if (commandName === "set-code") {
		await interaction.reply(
			"Possible set code for searching:\ne: Eternal format\nv: Vanilla"
		)
	} else if (commandName === "ping") {
		await interaction.reply("Pong!")
	} else if (commandName === "restart") {
		if (interaction.user.id == 601821309881810973) {
			await interaction.reply("Committing death...")
			throw new Error("KILL YOURSELF BITCH")
		} else await interaction.reply("no")
	} else if (commandName === "draft") {
		const set = options.getString("set")
		const deckSize = options.getString("size")
			? options.getString("size")
			: 20
		const pool = listDiff(
			setsCardPool[set],
			[]
				.concat(options.getBoolean("beast") ? setsBeastPool[set] : [])
				.concat(options.getBoolean("undead") ? setsUndeadPool[set] : [])
				.concat(options.getBoolean("tech") ? setsTechPool[set] : [])
				.concat(options.getBoolean("magick") ? setsMagickPool[set] : [])
		)
		const message = await interaction.reply({
			content: "Loading...",
			fetchReply: true,
		})

		var deck = { cards: [], side_deck: "10 Squirrel" }

		for (cycle = 0; cycle < deckSize; cycle++) {
			// take 4 random common
			let temp = randomChoices(
				listDiff(listDiff(pool, setsRarePool[set]), setsBanPool[set]),
				4
			)
			// 1 one random rare
			temp.push(
				randomChoice(
					listDiff(
						listInter(pool, setsRarePool[set]),
						setsBanPool[set]
					)
				)
			)
			// generating stuff

			//set up a pack
			let pack = setsData[set].cards.filter((c) =>
				temp.includes(c.name.toLowerCase())
			)
			pack.sort((a, b) =>
				a.rare ? -1 : b.rare ? 1 : a.name.localeCompare(b.name)
			)

			//adding in wild if duplicate is found
			if (pack.length < 5) {
				for (i = 0; i < 5 - pack.length; i++) pack.push("wild")
			}

			// generating embed and button
			const embed = new EmbedBuilder()
				.setColor(Colors.Blue)
				.setTitle(
					`Pack Left: ${deckSize - cycle}\nCard in deck: ${
						deck.cards.length
					}`
				)
			const selectionList = new StringSelectMenuBuilder()
				.setCustomId("select")
				.setPlaceholder("Select a card!")

			let description = ""

			for (c in pack) {
				const card = pack[c]
				if (card === "wild") {
					// if wild make a special one
					embed.addFields({
						name: "Wild card",
						value: "You can use this card as any common card",
						inline: true,
					})
				} else {
					// generating the card description
					description += `Attack: ${card.attack}\nHealth: ${card.health}\n`
					if (card.sigils)
						description += `Sigils: ${card.sigils.join(", ")}`

					// adding it into the embed
					embed.addFields({
						name: `${
							card.rare ? `**${card.name} (RARE)**` : card.name
						} (${
							card.blood_cost ? `${card.blood_cost} Blood ` : ""
						}${card.bone_cost ? `${card.bone_cost} Bone ` : ""}${
							card.energy_cost
								? `${card.energy_cost} Energy `
								: ""
						}${
							card.mox_cost ? `${card.mox_cost.join(", ")} ` : ""
						}${
							!card.blood_cost &&
							!card.bone_cost &&
							!card.energy_cost &&
							!card.mox_cost
								? "Free"
								: ""
						})\n`,
						value: description,
					})
				}

				// add the selection
				selectionList.addOptions({
					label: card.name,
					value: `${card.name}${c}`,
				})

				// reset description
				description = ""
			}

			// send embed and selection
			await interaction.editReply({
				content: "",
				components: [
					new ActionRowBuilder().addComponents(selectionList),
				],
				embeds: [embed],
			})

			await message
				.awaitMessageComponent({
					componentType: ComponentType.StringSelect,
					time: 60000,
				})
				.then(async (i) => {
					const cardName = i.values[0].slice(0, -1)
					deck.cards.push(cardName)
					await i.update({
						embeds: [
							new EmbedBuilder()
								.setTitle(`Selected ${cardName}`)
								.setDescription(
									"Selection successful loading next pack"
								),
						],
					})
				})
		}

		await interaction.editReply({
			content: `Completed Deck: ${deck.cards.join(
				", "
			)}\nDeck Json: \`${JSON.stringify(deck)}\``,
			embeds: [],
			components: [],
		})
	}
})

client.on(Events.MessageCreate, async (message) => {
	if (message.author.id === clientId) return

	const m = message.content.match(/([\w]|)\[{2}[^\]]+\]{2}/g)
	if (!m) return

	let embedList = []
	let attachmentList = []

	for (const cn of m) {
		const temp = await genCardEmbed(cn)
		if (temp[1] === -1) {
			embedList.push(temp[0])
			continue
		}

		embedList.push(temp[0])
		attachmentList.push(temp[1])
	}

	await message.reply({
		embeds: embedList,
		files: attachmentList,
		allowedMentions: {
			repliedUser: false,
		},
	})
})
client.login(t) // login the bot
