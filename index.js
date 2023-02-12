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
const saveLookup = require("./saveLookup.json")

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
	for (let choice = 0; choice < num; choice++) {
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

const specialMagick = [
	"Mox Module",
	"Bleene's Mox",
	"Goranj's Mox",
	"Orlu's Mox",
	"Mage Pupil",
	"Skelemagus",
	"Gem Detonator",
	"Gem Guardian",
	"Horse Mage",
] // these card will be consider magick no matter what
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

		for (const card of setsData[setCode].cards) {
			const name = card.name.toLowerCase()

			setsCardPool[setCode].push(name)

			if (card.banned) {
				setsBanPool[setCode].push(name)
			}

			if (card.rare) {
				setsRarePool[setCode].push(name)
			}

			if (specialMagick.includes(card.name)) {
				setsMagickPool[setCode].push(name)
			} else {
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
	for (const digit of num + []) {
		if (digit === "-") {
			out += getEmoji("negative")
		} else out += getEmoji(`${digit}_`)
	}
	return out
}

function countDeckDup(deck) {
	const singleDeck = new Set(deck)
	var out = {}
	for (const card of singleDeck) {
		out[card] = deck.filter(
			(c) => c.toLowerCase() === card.toLowerCase()
		).length
	}
	return out
}

async function genCardEmbed(rawName) {
	// get important shit
	let name = rawName.toLowerCase().trim()
	let selectedSet = "competitive"

	// check which ruleset it should be check from
	for (const code of Object.keys(setList)) {
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
		return [
			new EmbedBuilder()
				.setColor(Colors.Red)
				.setTitle(`Card "${name}" not found`)
				.setDescription(
					`No card found in selected set (${set.ruleset}) that have more than 40% similarity with the search term(${name})`
				),
			-1,
		]
	}

	// get the card pfp
	const portrait = Canvas.createCanvas(400, 280)
	const context = portrait.getContext("2d")
	var cardPortrait = await Canvas.loadImage(
		`https://github.com/107zxz/inscr-onln/raw/main/gfx/pixport/${card.name.replaceAll(
			" ",
			"%20"
		)}.png`
	)

	if (card.name == "Fox") {
		cardPortrait = await Canvas.loadImage(
			"https://cdn.discordapp.com/attachments/1038091526800162826/1069256708783882300/Screenshot_2023-01-30_at_00.31.53.png"
		)
	}
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
	if (card.description) description += `*${card.description}*\n\n`
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
	if (commandName === "echo") {
		if (interaction.user.id != 601821309881810973) return
		const message = options.getString("text")
		console.log(`${interaction.user.username} say ${message}`)
		const channel =
			(await options.getChannel("channel")) != undefined
				? options.getChannel("channel")
				: interaction.channel

		if (options.getString("message")) {
			var temp = await channel.messages.fetch(
				options.getString("message")
			)

			temp.reply(message)
		} else {
			channel.send(message)
		}

		await interaction.reply({
			content: "Sent",
			ephemeral: true,
		})
	} else if (commandName === "set-code") {
		await interaction.reply(
			"Possible set code for searching:\ne: Eternal format\nv: Vanilla"
		)
	} else if (commandName === "ping") {
		await interaction.reply("Pong!")
	} else if (commandName === "restart") {
		if (
			interaction.member.roles.cache.some(
				(role) => role.id == 994578531671609426
			)
		) {
			await interaction.reply("Restarting...")
			throw new Error("death")
		} else await interaction.reply("no")
	} else if (commandName === "draft") {
		const set = options.getString("set")
		const deckSize = options.getInteger("size")
			? options.getInteger("size")
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
		var wildCount = 0
		let flag = false

		for (let cycle = 0; cycle < deckSize; cycle++) {
			// take 4 random common
			let temp = randomChoices(
				listDiff(listDiff(pool, setsRarePool[set]), setsBanPool[set]),
				4
			)

			// 1 one random rare
			temp.push(
				randomChoice(
					listDiff(
						listDiff(
							listInter(pool, setsRarePool[set]),
							deck.cards
								.map((c) =>
									c.startsWith("*")
										? c.replaceAll("*", "")
										: c
								)
								.map((n) => n.toLowerCase())
						),
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
				for (let card = 0; card < 5 - pack.length; card++) {
					const newCard = randomChoice(
						listDiff(
							listDiff(
								listDiff(pool, setsRarePool[set]),
								setsBanPool[set]
							),
							temp
						)
					)
					pack.push(
						setsData[set].cards.find(
							(c) => c.name.toLowerCase() === newCard
						)
					)
				}
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

			var description = ""

			for (let c in pack) {
				const card = pack[c]

				// generating the card description
				description += `**${
					card.rare ? `${card.name} [RARE]` : card.name
				} (${card.blood_cost ? `${card.blood_cost} Blood ` : ""}${
					card.bone_cost ? `${card.bone_cost} Bone ` : ""
				}${card.energy_cost ? `${card.energy_cost} Energy ` : ""}${
					card.mox_cost ? `${card.mox_cost.join(", ")} ` : ""
				}${
					!card.blood_cost &&
					!card.bone_cost &&
					!card.energy_cost &&
					!card.mox_cost
						? "Free"
						: ""
				})**\nAttack: ${card.attack}\nHealth: ${card.health}\n${
					card.sigils ? `Sigils: ${card.sigils.join(", ")}` : ""
				}\n\n`

				// add the selection
				selectionList.addOptions({
					label: card.name,
					value: `${card.rare ? "*" : ""}${card.name}${c}`,
				})
			}

			let deckStr = ""
			temp = countDeckDup(
				deck.cards.sort((a, b) =>
					a.startsWith("*")
						? -1
						: b.startsWith("*")
						? 1
						: a.localeCompare(b)
				)
			)
			for (const card of Object.keys(temp)) {
				deckStr += `${temp[card]}x | ${card}\n`
			}
			embed.addFields(
				{
					name: "=============== PACK ===============",
					value: description,
					inline: true,
				},
				{
					name: `======= DECK =======`,
					value: deck.cards.length < 1 ? "Blank" : deckStr,
					inline: true,
				}
			)

			// send embed and selection
			await interaction.editReply({
				content: "",
				components: [
					new ActionRowBuilder().addComponents(selectionList),
				],
				embeds: [embed],
			})
			const filter = (i) => i.user.id === interaction.user.id

			await message
				.awaitMessageComponent({
					componentType: ComponentType.StringSelect,
					time: 180000,
					filter,
				})
				.then(async (i) => {
					const cardName = i.values[0].slice(0, -1)
					let temp = cardName.startsWith("*")
						? `**${cardName.slice(1)}**`
						: cardName

					if (
						deck.cards.filter(
							(c) => c.toLowerCase() === temp.toLowerCase()
						).length >= 4
					) {
						deck.cards.push("** *WILD CARD* **")
						wildCount++
					} else deck.cards.push(temp)

					await i.update({
						embeds: [embed],
					})
				})
				.catch((err) => {
					flag = true
				})

			if (flag) {
				await interaction.editReply({
					content: "Some error happen ¯\\_(ツ)_/¯",
					embeds: [],
					components: [],
				})
				break
			}
		}

		if (flag) return

		deck.cards = deck.cards
			.map((c) => {
				let out
				out = c.replaceAll("*", "").trim()
				if (out === "WILD CARD") {
					out = ""
				}
				return out
			})
			.filter((c) => c != "")

		await interaction.editReply({
			content: `**You have ${wildCount} Wild Card. You can replace them with any common card**\nCompleted Deck: ${deck.cards.join(
				", "
			)}\n\nDeck Json: \`${JSON.stringify(deck)}\``,
			embeds: [],
			components: [],
		})
	} else if (commandName === "deck-to-set") {
		await interaction.reply("Generating...")
		let cardNotfound = []

		// attachment grabbing code source https://stackoverflow.com/questions/67652628/reading-file-attachments-ex-txt-file-discord-js
		const response = await fetch(options.getAttachment("save").url)

		// regex source https://github.com/jlcrochet/inscryption_save_editor/blob/main/app.vue
		const saveFile = JSON.parse(
			(await response.text())
				.replace(/\$iref:\d+/g, '"$&"')
				.replace(
					/"(position|\w*?Position)":\s*{\s*"\$type":\s*(".*?"|-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\s*}/g,
					'"$1":{"$type":$2,"x":$3,"y":$4}'
				)
		)

		var outputSet = JSON.parse(JSON.stringify(setsData.vanilla))
		outputSet.ruleset = "Magpie Autogen"
		outputSet.ant_limit = 4
		outputSet.allow_snuffing_candles = false
		outputSet.portrait = "portraits/Worker Ant"
		outputSet.description =
			"Ruleset from Inscryption's run.\nThis ruleset use the vanilla as base.\nSome kmod card may not show up."
		outputSet.cards = [
			{
				name: "Squirrel",
				attack: 0,
				health: 1,
				banned: true,
			},
		]
		outputSet.side_decks = {
			"10 Squirrels": {
				type: "single",
				card: "Squirrel",
				count: 10,
			},
		}

		var i = 1
		for (let card of saveFile.ascensionData.currentRun.playerDeck
			.cardIdModInfos.$rcontent) {
			if (card.$v.$rlength > 0) {
				const baseCard = setsData.vanilla.cards.find(
					(c) =>
						c.name.toLowerCase() ==
						(card.$k.includes("#")
							? card.$k.slice(0, -2)
							: card.$k
						).toLowerCase()
				)
				if (baseCard) {
					// grabbing the base card
					let cardData = JSON.parse(JSON.stringify(baseCard))

					// adding number into card name to avoid duplicate name
					cardData.name = card.$k

					// modifying the stat if the card been buff by campfire
					cardData.attack += card.$v.$rcontent[0].attackAdjustment
					cardData.health += card.$v.$rcontent[0].healthAdjustment

					// giving it extra sigil
					if (card.$v.$rcontent[0].abilities.$rlength > 0) {
						cardData.sigils = []
						card.$v.$rcontent[0].abilities.$rcontent.forEach(
							(sigil) => {
								if (
									setsData.competitive.working_sigils.includes(
										saveLookup.sigilIds[sigil]
									)
								)
									cardData.sigils.push(
										saveLookup.sigilIds[sigil]
									)
							}
						)
					}

					// putting it in the ruleset
					outputSet.cards.push(cardData)
				} else {
					cardNotfound.push(card.$k)
				}
			} else {
				const cardData = setsData.vanilla.cards.find(
					(c) => c.name.toLowerCase() == card.$k.toLowerCase()
				)

				if (cardData) {
					console.log(cardData.name + " 1")
					outputSet.cards.push(cardData)
				} else {
					cardNotfound.push(card.$k)
				}
			}
			i++
		}
		await interaction.editReply({
			content: "Some card are missing",
			files: [
				new AttachmentBuilder()
					.setFile(Buffer.from(JSON.stringify(outputSet), "utf-8"))
					.setName("hello.json"),
			],
		})
		console.log(JSON.stringify(outputSet))
	}
})

client.on(Events.MessageCreate, async (message) => {
	if (message.author.id === clientId) return

	const m = message.content.match(/(\w|)\[{2}[^\]]+\]{2}/g)
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
