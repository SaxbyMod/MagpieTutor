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
	ButtonStyle,
} = require("discord.js")
const StringSimilarity = require("string-similarity")

const Canvas = require("@napi-rs/canvas")
const fetch = require("node-fetch")
const http = require("http")

const { betaToken, token, clientId } = require("./config.json")
const { ButtonBuilder } = require("@discordjs/builders")

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

const drawList = (list, num) => {
	let out = []
	for (let choice = 0; choice < num; choice++) {
		let e = Math.floor(Math.random() * list.length)
		out.push(list[e])
		list.splice(e, 1)
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
	bell: "Bell Power",
	hand: "Hand Size Power",
}

const specialAttackDescription = {
	green_mox:
		'This card\'s power is the number of creature you control that have the sigil "Green Mox"',
	mirror: "This card's power is the power of the opposing creature",
	ant: "This card's power is number of ant you control.",
	bell: "This card's power is the closeness it is to the bell",
	hand: "This card's power is the number of the cards in your hand",
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

function coloredString(str) {
	const codeList = {
		$$g: "\u001b[0;30m",
		$$r: "\u001b[0;31m",
		$$e: "\u001b[0;32m",
		$$y: "\u001b[0;33m",
		$$b: "\u001b[0;34m",
		$$p: "\u001b[0;35m",
		$$c: "\u001b[0;36m",
		$$w: "\u001b[0;37m",

		$$1: "\u001b[0;40m",
		$$2: "\u001b[0;41m",
		$$3: "\u001b[0;42m",
		$$4: "\u001b[0;43m",
		$$5: "\u001b[0;44m",
		$$6: "\u001b[0;45m",
		$$7: "\u001b[0;46m",
		$$8: "\u001b[0;47m",

		$$l: "\u001b[1m",
		$$u: "\u001b[4m",

		$$0: "\u001b[0m",
	}

	for (const code of Object.keys(codeList)) {
		str = str.replaceAll(code, codeList[code])
	}
	return str
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

	if (name.includes("your mom")) {
		return [getEmoji("skelemagun"), -2]
	}

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
	} else if (card.name == "Geck") {
		card.sigils = ["Omni Strike"]
	} else if (card.name == "Bell Tentacle") {
		card.atkspecial = "bell"
	} else if (card.name == "Hand Tentacle") {
		card.atkspecial = "hand"
	}

	// scale the pfp
	const portrait = Canvas.createCanvas(
		cardPortrait.width * 10,
		cardPortrait.height * 10
	)
	const context = portrait.getContext("2d")
	context.imageSmoothingEnabled = false
	context.drawImage(cardPortrait, 0, 0, portrait.width, portrait.height)

	// generate sigil description
	let sigilDescription = ""
	if (card.sigils) {
		card.sigils.forEach((sigil) => {
			sigilDescription += `**${sigil}**:\n ${set.sigils[sigil]}\n`
		})
	}

	let embed = new EmbedBuilder()
		.setColor(card.rare ? Colors.Green : Colors.Greyple)
		.setTitle(`${card.name} [${set.ruleset}]`)
		.setThumbnail(
			`attachment://${card.name.replaceAll(" ", "").slice(0, 4)}.png`
		)
		.setFooter({
			text: `*This card was selected because it matches ${
				Math.round(bestMatch.rating * 10000) / 100
			}% with the search term (${name})*`,
		})

	// generate the description
	let generalInfo = ""
	let extraInfo = ""

	// bool stuff
	if (card.description) generalInfo += `*${card.description}*\n`
	if (card.rare) generalInfo += "**Rare**, "
	if (card.conduit) generalInfo += "**Conductive**, "
	if (card.nosac) generalInfo += "**Can't be sacrifice**, "
	if (card.banned) generalInfo += "**Banned**, "

	// cost stuff
	if (card.blood_cost)
		generalInfo += `\n**Blood Cost**: ${getEmoji("blood")}${getEmoji(
			"x_"
		)}${numToEmoji(card.blood_cost)}`

	if (card.bone_cost)
		generalInfo += `\n**Bone Cost**: ${getEmoji("bonebone")}${getEmoji(
			"x_"
		)}${numToEmoji(card.bone_cost)}`

	if (card.energy_cost)
		generalInfo += `\n**Energy Cost**: ${getEmoji("energy")}${getEmoji(
			"x_"
		)}${numToEmoji(card.energy_cost)}`

	if (card.mox_cost)
		generalInfo += `\n**Mox Cost**: ${
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
		generalInfo += "\n**Free**"

	generalInfo += `\n**Stat**: ${
		card.atkspecial ? `**${specialAttack[card.atkspecial]}**` : card.attack
	} / ${card.health} ${
		card.atkspecial ? `(${specialAttackDescription[card.atkspecial]})` : ""
	}`

	embed.setDescription(generalInfo)

	// other
	if (card.evolution) {
		extraInfo += `\n**Change into**: ${card.evolution}\n`
	}
	if (card.left_half)
		extraInfo += `\n**This card split into**: ${card.left_half} (Left), ${card.right_half} (Right)\n`
	if (card.sheds) extraInfo += `\n**Shed**: ${card.sheds}\n`

	if (card.sigils)
		embed.addFields({
			name: "=============== SIGIL ===============",
			value: sigilDescription,
			inline: true,
		})

	if (extraInfo != "") {
		embed.addFields({
			name: "===================== EXTRA INFO =====================",
			value: extraInfo,
		})
	}
	return [
		embed,
		new AttachmentBuilder(await portrait.encode("png"), {
			name: `${card.name.replaceAll(" ", "").slice(0, 4)}.png`,
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
		//if (interaction.user.id != 601821309881810973) return
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
				})**\nAttack: ${
					card.atkspecial
						? specialAttack[card.atkspecial]
						: card.attack
				}\nHealth: ${card.health}\n${
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

			let error = ""
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
					error = err
				})

			if (flag) {
				await interaction.editReply({
					content: `Error: \`\`\`ansi\n\u001b[0;31m${error}\`\`\`\nCurrent deck: \`${deck.cards
						.map((c) => {
							let out
							out = c.replaceAll("*", "").trim()
							if (out === "WILD CARD") {
								out = ""
							}
							return out
						})
						.filter((c) => c != "")
						.join(", ")}\`\n\nCurrentDeck Json: \`${JSON.stringify(
						deck
					)}\``,
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
	} else if (commandName === "deck-sim") {
		let fullDeck = []

		if (options.getAttachment("deck-file")) {
			fullDeck = JSON.parse(
				await (
					await fetch(options.getAttachment("deck-file").url)
				).text()
			).cards
		} else if (options.getString("deck-list")) {
			fullDeck = options
				.getString("deck-list")
				.split(",")
				.map((c) => c.trim())
		} else {
			await interaction.reply("Deck missing")
			return
		}

		let currDeck = JSON.parse(JSON.stringify(fullDeck))

		const message = await interaction.reply({
			content: "Doing stuff please wait",
			fetchReply: true,
		})
		let stillRunning = true
		const detailMode = options.getBoolean("detail")

		let hand = drawList(currDeck, 3)
		while (stillRunning) {
			let tempstr = ""
			let temp
			Object.keys(countDeckDup(hand)).forEach((c) => {
				tempstr += `${countDeckDup(hand)[c]}x ${c}\n`
			})

			let embed = new EmbedBuilder()
				.setColor(Colors.Orange)
				.setTitle("Thingy")
				.setDescription("Here you hand")
				.addFields({
					name: "====== HAND ======",
					value: tempstr,
					inline: true,
				})

			if (detailMode) {
				tempstr = ""
				temp = [countDeckDup(fullDeck), countDeckDup(currDeck)]
				Object.keys(temp[0]).forEach((c) => {
					tempstr += `${!temp[1][c] ? `~~0` : temp[1][c]}/${
						temp[0][c]
					}) **${c}** (${
						Math.round(
							((!temp[1][c] ? 0 : temp[1][c]) / currDeck.length) *
								100
						) === 0
							? `0%)~~`
							: `${Math.round(
									((!temp[1][c] ? 0 : temp[1][c]) /
										currDeck.length) *
										100
							  )}%)`
					}\n`
				})
				embed.addFields({
					name: "====== DRAW PERCENTAGE ======",
					value: tempstr,
					inline: true,
				})
			}

			let selectionList = new StringSelectMenuBuilder()
				.setPlaceholder("Select a card to play/remove/discard")
				.setCustomId("play")

			for (c of new Set(hand)) {
				selectionList.addOptions({
					label: c,
					value: c,
				})
			}

			await interaction.editReply({
				embeds: [embed],
				components: [
					new ActionRowBuilder().addComponents(selectionList),
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setLabel("Draw")
							.setStyle(ButtonStyle.Success)
							.setCustomId("draw"),
						new ButtonBuilder()
							.setLabel("End")
							.setStyle(ButtonStyle.Danger)
							.setCustomId("end")
					),
				],
			})

			const filter = (i) => i.user.id === interaction.user.id

			await message
				.awaitMessageComponent({
					time: 60000,
					filter,
				})
				.then(async (i) => {
					if (i.customId === "draw") {
						hand.push(drawList(currDeck, 1)[0])
					} else if (i.customId === "play") {
						hand.splice(hand.indexOf(i.values[0]), 1)
					} else if (i.customId === "end") {
						stillRunning = false
					}
					await i.update("updating")
				})
				.catch((err) => {
					console.log(err)
					stillRunning = false
				})
		}
		await interaction.editReply({
			embeds: [
				new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle("Deck Simulation Ended")
					.setDescription("The simulation Ended"),
			],
		})
	} else if (commandName === "tunnel-status") {
		await http
			.get("http://localtunnel.me", async (res) => {
				await interaction.reply("Tunnel is up and running")
			})
			.on("error", async (e) => {
				await interaction.reply(
					"Stoat's laptop say tunnel is down, but you can check it yourself: https://isitdownorjust.me/localtunnel-me/"
				)
			})
	} else if (commandName === "color-text") {
		await interaction.reply({
			content: `Raw message:\n \\\`\\\`\\\`ansi\n${coloredString(
				options.getString("string")
			)}\\\`\\\`\\\`\n\nThe output will be like this:\n\`\`\`ansi\n${coloredString(
				options.getString("string")
			)}\`\`\``,
			ephemeral: true,
		})
	}
})

client.on(Events.MessageCreate, async (message) => {
	if (message.author.id === clientId) return

	const m = message.content.match(/(\w|)\[{2}[^\]]+\]{2}/g)
	if (!m) return

	let embedList = []
	let attachmentList = []
	let msg = ""

	for (const cn of m) {
		const temp = await genCardEmbed(cn)
		if (temp[1] === -1) {
			embedList.push(temp[0])
			continue
		} else if (temp[1] === -2) {
			msg += temp[0]
			continue
		}

		embedList.push(temp[0])
		attachmentList.push(temp[1])
	}

	var replyOption = {
		allowedMentions: {
			repliedUser: false,
		},
	}

	if (msg !== "") replyOption["content"] = msg
	if (embedList.length > 0) replyOption["embeds"] = embedList
	if (attachmentList.length > 0) replyOption["files"] = attachmentList

	await message.reply(replyOption)
})

client.login(t) // login the bot
