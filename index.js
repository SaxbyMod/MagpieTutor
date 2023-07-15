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
	TextInputBuilder,
	ModalBuilder,
	TextInputStyle,
} = require("discord.js")

const StringSimilarity = require("string-similarity")
const scryfall = require("scryfall")

const Canvas = require("@napi-rs/canvas")
const fetch = require("node-fetch")
const http = require("http")

const { token, clientId } = require("./config.json")
const { ButtonBuilder } = require("@discordjs/builders")
const format = require("string-format")

format.extend(String.prototype, {})

//set up the bot client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMessageReactions,
	],
	partials: [Partials.Message],
})

// stuff for bot

const randInt = (min, max) => {
	return Math.floor(Math.random() * (max - min + 1)) + min
}
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
		if (list.length < 1) return out
		let e = Math.floor(Math.random() * list.length)
		out.push(list[e])
		list.splice(e, 1)
	}
	return out
}

const shuffleList = (list) => {
	for (let i = list.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[list[i], list[j]] = [list[j], list[i]]
	}
	return list
}

const countDeckDup = (deck) => {
	const singleDeck = new Set(deck)
	var out = {}
	for (const card of singleDeck) {
		out[card] = deck.filter(
			(c) => c.toLowerCase() === card.toLowerCase()
		).length
	}
	return out
}

const listDiff = (list1, list2) => list1.filter((x) => !list2.includes(x))
const listInter = (list1, list2) => list1.filter((x) => list2.includes(x))

const isPerm = (interaction) =>
	interaction.member.roles.cache.some(
		(role) =>
			role.id == "994578531671609426" ||
			role.id == "1028537837169156156" ||
			role.id == "1111314861226459180"
	) || interaction.user.id == "601821309881810973"

const getMessage = async (channel, id) => {
	return await channel.messages.fetch(id)
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)
//define the ruleset shit
const setFormatList = {
	imf: {
		general: {
			type: "general",
			info: [
				{ text: "*{description}*\n", type: "sub" },
				{
					text: `\n**Blood Cost**: :{blood_cost}::x_::imfBlood:`,
					type: "sub",
				},
				{
					text: "\n**Bone Cost**: :{bone_cost}::x_::imfBone:",
					type: "sub",
				},
				{
					text: "\n**Energy Cost**: :{energy_cost}::x_::imfEnergy:",
					type: "sub",
				},
				{ text: "\n**Mox Cost**: {mox_cost}", type: "mox" },
				{ text: "\n\n{health}", type: "stat" },
			],
		},
		sigil: {
			type: "keyword",
			name: "== SIGILS ==",
			var: "sigils",
		},
		extra: {
			type: "extra",
			name: "== EXTRA INFO ==",
			info: [
				{ text: "**Change into**: {evolution}\n", type: "sub" },
				{ text: "**Shed**: {sheds}\n", type: "sub" },
				{
					text: "**This card split into**: {left_half} (Left), {right_half} (Right)\n",
					type: "sub",
				},
			],
		},
	},
	imfCompact: {
		general: {
			type: "general",
			info: [
				{
					text: `:{blood_cost}::imfBlood: `,
					type: "sub",
				},
				{
					text: ":{bone_cost}::imfBone: ",
					type: "sub",
				},
				{
					text: ":{energy_cost}::imfEnergy: ",
					type: "sub",
				},
				{ text: "{mox_cost}", type: "mox" },
				{ text: "\n{health}", type: "stat" },
				{ text: "\n**Sigils**: {sigils}\n", type: "list" },
				{ text: "**Change into**: {evolution}\n", type: "sub" },
				{ text: "**Shed**: {sheds}\n", type: "sub" },
				{
					text: "**This card split into**: {left_half} (Left), {right_half} (Right)",
					type: "sub",
				},
			],
		},
	},
	augmented: {
		general: {
			type: "general",
			info: [
				{ text: "*{description}*\n", type: "sub" },
				{ text: "**Temple**: {temple}\n", type: "sub" },
				{ text: "**Tier**: {tier}\n", type: "sub" },
				{ text: "**Tribes**: {tribes}\n", type: "sub" },
				{ text: "\n**Blood Cost**: :{blood}::x_::blood:", type: "sub" },
				{ text: "\n**Bone Cost**: :{bone}::x_::bones:", type: "sub" },
				{
					text: "\n**Energy Cost**: :{energy}::x_::energy:",
					type: "sub",
				},
				{ text: "\n**Mox Cost**: {mox}", type: "mox" },
				{ text: "\n**Shattered Mox Cost**: {shattered}", type: "mox" },
				{ text: "\n\n{health}", type: "stat" },
			],
		},
		sigil: {
			type: "keyword",
			name: "== SIGILS ==",
			var: "sigils",
		},
		trait: { type: "keyword", name: "== TRAITS ==", var: "traits" },
		extra: {
			type: "extra",
			name: "== EXTRA INFO ==",
			info: [{ text: "**Token**: {token}", type: "sub" }],
		},
	},
	augmentedCompact: {
		general: {
			type: "general",
			info: [
				{ text: "{tribes} {tier}\n", type: "sub" },

				{ text: ":{blood}::blood: ", type: "sub" },
				{ text: ":{bone}::bones:", type: "sub" },
				{
					text: ":{energy}::energy: ",
					type: "sub",
				},
				{ text: "{mox} ", type: "mox" },
				{ text: "{shattered}", type: "mox" },
				{ text: "\n{health}", type: "stat" },
				{ text: "\n**Sigils**: {sigils}", type: "list" },
				{ text: "\n**Traits**: {traits}", type: "list" },
				{ text: "\n**Token**: {token}", type: "sub" },
			],
		},
	},
	redux: {
		general: {
			type: "general",
			info: [
				{ text: "*{description}*\n", type: "sub" },
				{
					text: `\n**Blood Cost**: :{blood_cost}::x_::imfBlood:`,
					type: "sub",
				},
				{
					text: `\n**Sap Cost**: :{sap_cost}::x_::sap:`,
					type: "sub",
				},
				{
					text: "\n**Bone Cost**: :{bone_cost}::x_::imfBone:",
					type: "sub",
				},
				{
					text: "\n**Energy Cost**: :{energy_cost}::x_::imfEnergy:",
					type: "sub",
				},
				{
					text: "\n**Cell Cost**: :{cell_cost}::x_::cell:",
					type: "sub",
				},
				{
					text: "\n**Heat Cost**: :{heat_cost}::x_::heat:",
					type: "sub",
				},
				{ text: "\n**Mox Cost**: {mox_cost}", type: "mox" },
				{ text: "\n\n{health}", type: "stat" },
			],
		},
		sigil: { type: "special_keyword", name: "== SIGILS ==", var: "sigils" },
	},
}

const setList = {
	//imf set
	comp: {
		name: "competitive",
		type: "107",
		format: setFormatList.imf,
		compactFormat: setFormatList.imfCompact,
	},
	e: {
		name: "eternal",
		type: "107",
		format: setFormatList.imf,
		compactFormat: setFormatList.imfCompact,
	},
	v: {
		name: "vanilla",
		type: "107",
		format: setFormatList.imf,
		compactFormat: setFormatList.imfCompact,
	},

	//other set
	a: {
		name: "augmented",
		type: "specialLoad",
		format: setFormatList.augmented,
		compactFormat: setFormatList.augmentedCompact,
		file: "./extra/augmentedProcess.js",
	},
	r: {
		name: "redux",
		type: "specialLoad",
		format: setFormatList.redux,
		compactFormat: setFormatList.redux,
		file: "./extra/reduxProcess.js",
	},

	// special set
	m: { name: "magic the gathering", type: "special" },

	// modifier
	o: {
		name: "original version",
		type: "modifier",
	},
	c: {
		name: "compact",
		type: "modifier",
	},
}

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
	//fetch all the set json
	for (const set of Object.values(setList)) {
		if (set.type === "107") {
			await fetch(
				`https://raw.githubusercontent.com/107zxz/inscr-onln-ruleset/main/${set.name}.json`
			)
				.then((res) => res.json())
				.then((json) => {
					setsData[set.name] = json
				})
		} else if (set.type == "other") {
			setsData[set.name] = require(set.file)
		} else if (set.type == "specialLoad") {
			setsData[set.name] = await require(set.file).load()
		}
		console.log(`Set ${set.name} loaded!`)
	}

	// loading all the card pool
	for (const set of Object.keys(setsData)) {
		setsCardPool[set] = []
		setsBanPool[set] = []
		setsRarePool[set] = []
		setsBeastPool[set] = []
		setsUndeadPool[set] = []
		setsTechPool[set] = []
		setsMagickPool[set] = []

		for (const card of setsData[set].cards) {
			const name = card.name.toLowerCase()

			setsCardPool[set].push(name)

			if (card.banned) {
				setsBanPool[set].push(name)
			}

			if (card.rare) {
				setsRarePool[set].push(name)
			}

			if (specialMagick.includes(card.name)) {
				setsMagickPool[set].push(name)
			} else {
				if (card.blood_cost) {
					setsBeastPool[set].push(name)
				}
				if (card.bone_cost) {
					setsUndeadPool[set].push(name)
				}
				if (card.energy_cost) {
					setsTechPool[set].push(name)
				}
				if (card.mox_cost) {
					setsMagickPool[set].push(name)
				}
			}
		}
	}
})()

const specialAttackDescription = {
	green_mox:
		'This card\'s power is the number of creatures you control that have the sigil "Green Mox"',
	mox: "This card's power is the number of moxes you control",
	mirror: "This card's power is the power of the opposing creature",
	ant: "This card's power is number of ant you control.",
	bell: "This card's power is how close it is to the bell",
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

function coloredString(str, raw) {
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
	return raw ? str : `\`\`\`ansi\n${str}\`\`\``
}

async function messageSearch(message, returnValue = false) {
	const start = performance.now()
	let embedList = []
	let attachmentList = []
	let msg = ""
	if (!message.content.toLowerCase().match(/(\w{0,3})\[{2}([^\]]+)\]{2}/g)) {
		return
	}
	outer: for (const cardName of message.content
		.toLowerCase()
		.matchAll(/(\w{0,3})\[{2}([^\]]+)\]{2}/g)) {
		let selectedSet = setList[cardName[1][0]]
			? setList[cardName[1][0]]
			: setList.comp
		let name = cardName[2]
		let card
		let noAlter = false
		let compactDisplay = false

		redo: while (true) {
			if (selectedSet.type == "special") {
				if (selectedSet.name == "magic the gathering") {
					const card = await fetchMagicCard(name)

					if (card == -1) {
						embedList.push(
							new EmbedBuilder()
								.setColor(Colors.Red)
								.setTitle(`Card "${name}" not found`)
								.setDescription(
									`Magic card ${name} not found\n`
								)
						)
					} else {
						attachmentList.push(card.image_uris.normal)
					}
				}
				continue outer
			} else if (selectedSet.type == "modifier") {
				if (selectedSet.name == "original version") {
					noAlter = true
				} else if (selectedSet.name == "compact") {
					compactDisplay = true
				}
				selectedSet = setList[cardName[1][1]]
					? setList[cardName[1][1]]
					: setList.comp
				continue redo
			}
			break
		}

		// get the best match
		const bestMatch = StringSimilarity.findBestMatch(
			name,
			setsCardPool[selectedSet.name]
		).bestMatch

		// if less than 40% match return error and continue to the next match
		if (bestMatch.rating <= 0.4) {
			if (name == "old_data") {
				card = {
					name: "Lorem",
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
					sigils: ["Repulsive", "Bone King"],
					blood_cost: -69,
					bone_cost: -69,
					energy_cost: -69,
					mox_cost: ["Green", "Blue", "Orange"],

					attack: 69,
					health: 420,
					atkspecial: "mirror",

					conduit: true,
					rare: true,
					nosac: true,
					nohammer: true,
					banned: true,

					evolution: "I'm",
					sheds: "Doing",
					left_half: "Ur",
					right_half: "Mom :)",

					url: "https://static.wikia.nocookie.net/inscryption/images/4/4e/Glitched_Card.gif/revision/latest?cb=20211103141811",
					set: "competitive",
				}
			} else if (name == "deep_data") {
				card = {
					name: "Lorem",
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
					sigils: ["Repulsive", "Bone King"],
					blood: -69,
					bone: -69,
					energy: -69,
					mox: ["emerald", "sapphire", "ruby"],
					shattered: [
						"shattered_emerald",
						"shattered_sapphire",
						"shattered_ruby",
					],

					attack: 69,
					health: 420,

					url: "https://static.wikia.nocookie.net/inscryption/images/4/4e/Glitched_Card.gif/revision/latest?cb=20211103141811",
					set: "augmented",
				}
			} else {
				embedList.push(
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle(`Card "${name}" not found`)
						.setDescription(
							`No card found in selected set (${
								setsData[selectedSet.name].ruleset
							}) that have more than 40% similarity with the search term(${name})`
						)
				)
				continue
			}
		} else {
			card = await fetchCard(bestMatch.target, selectedSet.name, noAlter)
		}

		let temp = await genCardEmbed(card, compactDisplay)

		embedList.push(temp[0])
		if (temp[1] != 1) attachmentList.push(temp[1])
	}

	var replyOption = {
		allowedMentions: {
			repliedUser: false,
		},
		components: [
			new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setLabel("Retry")
					.setCustomId("retry")
					.setStyle(ButtonStyle.Primary)
			),
		],
	}

	if (msg !== "") replyOption["content"] = msg
	if (embedList.length > 0) replyOption["embeds"] = embedList
	if (attachmentList.length > 0) replyOption["files"] = attachmentList
	const end = performance.now()
	console.log(`Search comnplete in ${end - start}ms`)
	if (
		replyOption["content"] ||
		replyOption["embeds"] ||
		replyOption["files"]
	) {
		if (returnValue) return replyOption
		await message.reply(replyOption)
	}
}

function genDescription(textFormat, card) {
	let out = {}

	for (const field of Object.values(textFormat)) {
		completeInfo = ""

		if (field.type == "keyword") {
			if (card[field.var]) {
				card[field.var].forEach((keyword) => {
					completeInfo += `**${keyword}**: ${
						setsData[card.set].sigils[keyword]
					}\n`
				})
			}
		} else if (field.type == "special_keyword") {
			if (card[field.var]) {
				card[field.var].forEach((keyword) => {
					completeInfo += `**${keyword.name}**: ${keyword.description}`
				})
			}
		} else {
			for (const info of Object.values(field.info)) {
				if (!info.text.match(/{(\w+)}/g)) {
					completeInfo += info.text
					continue
				}
				let temp = card[info.text.match(/{(\w+)}/g)[0].slice(1, -1)]
				if (!temp) continue
				if (info.type == "mox") {
					if (temp.length < 1) continue
					// idk what this do anymore i was very high
					temp = {} // make a dict to put them in so .format can use it as key
					temp[
						info.text.match(/{(\w+)}/g)[0].slice(1, -1)
					] /* field name = var name */ = card[
						info.text.match(/{(\w+)}/g)[0].slice(1, -1)
					]
						.map((a) => `:${a}:`.toLowerCase())
						.join("") // put the mox in : to make it emoji
					completeInfo += info.text.format(temp)
				} else if (info.type == "list") {
					completeInfo += info.text.format(card)
				} else if (info.type == "stat") {
					completeInfo += info.text.replace(
						"{health}",
						`**Stat**: ${
							card.atkspecial
								? `:${card.atkspecial}:`
								: card.attack
						} / ${card.health} ${
							card.atkspecial
								? `(${
										specialAttackDescription[
											card.atkspecial
										]
								  })`
								: ""
						}`
					)
				} else {
					completeInfo += info.text.format(card)
				}
			}
		}
		if (field.type == "general") {
			out["general"] = completeInfo
		} else {
			out[field.name] = completeInfo
		}
	}
	return out
}

// fetch the card and its url
async function fetchCard(name, setName, noAlter = false) {
	let card

	let set = setsData[setName]

	card = JSON.parse(
		JSON.stringify(
			set.cards.find((c) => c.name.toLowerCase() === name.toLowerCase())
		)
	) // look for the card in the set

	if (!card) return card

	card.set = setName
	if (card.noArt) {
		card.url = undefined
	} else if (card.pixport_url) {
		card.url = card.pixport_url
	} else {
		if (card.set == setList.comp.name) {
			card.url = `https://github.com/107zxz/inscr-onln/raw/main/gfx/pixport/${card.name.replaceAll(
				" ",
				"%20"
			)}.png`
		} else if (card.set == setList.a.name) {
			card.url = `https://github.com/answearingmachine/card-printer/raw/main/art/${card.name.replaceAll(
				" ",
				"%20"
			)}.png`
		}
	}

	let original = JSON.parse(JSON.stringify(card))

	if (noAlter) {
		return card
	}

	// change existing card info and custom url
	if (card.name == "Fox") {
		card.url =
			"https://cdn.discordapp.com/attachments/1038091526800162826/1069256708783882300/Screenshot_2023-01-30_at_00.31.53.png"
	} else if (card.name == "Geck") {
		card.sigils = ["Omni Strike"]
	} else if (card.name == "Bell Tentacle") {
		card.atkspecial = "bell"
	} else if (card.name == "Hand Tentacle") {
		card.atkspecial = "hand"
	} else if (card.name == "Ruby Dragon") {
		card.url =
			"https://cdn.discordapp.com/attachments/999643351156535296/1082825510888935465/portrait_prism_dragon_gbc.png"

		card.name = "GAY DRAGON (Ruby Dragon)"
		card.description = "Modified portrait by ener"
	} else if (card.name == "Horse Mage") {
		card.url =
			"https://cdn.discordapp.com/attachments/999643351156535296/1082830680125341706/portrait_horse_mage_gbc.png"
		card.description = `Not make by ener :trolled:`
	} else if (card.name == "The Moon") {
		card.sigils = ["Omni Strike"]
	} else if (card.name == "Adder") {
		card.sigils = Array(6).fill("Handy")
	} else if (card.name == "Squirrel Ball") {
		card.description =
			"Remember that face when you arrive in hell - Squidman005#8375 the Squirrel Ball Man"
	} else if (card.name == "Ouroboros") {
		card.description = "Ouroboros is the source of all evil - 107"
	} else if (card.name == "Master Orlu") {
		card.description = undefined
	}

	if (JSON.stringify(original) != JSON.stringify(card)) {
		card.footnote =
			'This card has been edited to view original put "o" in front of you search.\nEx: e[[adder]] -> oe[[adder]]'
	}

	return card
}

// fetch the mtg card and its url
async function fetchMagicCard(name) {
	out = await scryfall.getCardByName(name, true).catch(async (err) => {
		return -1
	})

	return out
}

// generate embed
async function genCardEmbed(card, compactDisplay = false) {
	let attachment
	// try getting the portrait if it doesn't exist render no portrait
	try {
		if (card.url) {
			// get the card pfp
			let cardPortrait = await Canvas.loadImage(card.url)

			// scale the pfp
			const portrait = Canvas.createCanvas(
				cardPortrait.width * 10,
				cardPortrait.height * 10
			)
			const context = portrait.getContext("2d")
			context.imageSmoothingEnabled = false
			if (card.set == setList.a.name) {
				context.drawImage(
					await Canvas.loadImage(
						`https://github.com/answearingmachine/card-printer/raw/main/bg/bg_${
							["Common", "Uncommon", "Side Deck"].includes(
								card.tier
							)
								? "common"
								: "rare"
						}_${card.temple.toLowerCase()}.png`
					),
					0,
					0,
					portrait.width,
					portrait.height
				)
			}
			context.drawImage(
				cardPortrait,
				0,
				0,
				portrait.width,
				portrait.height
			)

			attachment = new AttachmentBuilder(await portrait.encode("png"), {
				name: `${card.name.replaceAll(" ", "").slice(0, 4)}.png`,
			})
		}
	} catch {}

	// create template
	let embed = new EmbedBuilder()
		.setColor(card.rare ? Colors.Green : Colors.Greyple)
		.setTitle(
			`${card.name} ${
				card.set ? `(${setsData[card.set].ruleset})` : ""
			} ${card.conduit ? getEmoji("conductive") : ""}${
				card.rare ? getEmoji("rare") : ""
			}${card.nosac ? getEmoji("unsacable") : ""}${
				card.nohammer ? getEmoji("unhammerable") : ""
			}${card.banned ? getEmoji("banned") : ""}`
		)

	if (attachment)
		embed.setThumbnail(
			`attachment://${card.name.replaceAll(" ", "").slice(0, 4)}.png`
		)

	const info = genDescription(
		Object.values(setList).find((set) => set.name == card.set)[
			compactDisplay ? "compactFormat" : "format"
		],
		card
	)

	// replace emoji shorthand to actual emoji identifier
	let alreadyChange = []
	for (let field of Object.keys(info)) {
		for (const emoji of info[field].matchAll(/:([^\sx:]+):/g)) {
			if (alreadyChange.includes(emoji[0])) continue
			try {
				if (!isNaN(parseInt(emoji[1]))) {
					info[field] = info[field].replaceAll(
						emoji[0],
						await numToEmoji(emoji[1])
					)
					continue
				}
				info[field] = info[field].replaceAll(
					emoji[0],
					await getEmoji(emoji[1])
				)
			} catch {}
			alreadyChange.push(emoji[0])
		}
	}

	info.general = info.general.replaceAll(":x_:", getEmoji("x_"))

	for (const fieldName of Object.keys(info)) {
		if (fieldName == "general") {
			embed.setDescription(info[fieldName])
		} else {
			if (info[fieldName])
				embed.addFields({
					name: fieldName,
					value: info[fieldName],
				})
		}
	}

	if (card.footnote) {
		embed.setFooter({ text: card.footnote })
	}
	return [embed, attachment ? attachment : 1] // if there an attachment (portrait/image) return it if not give exit code 1
}

// on ready call
client.once(Events.ClientReady, () => {
	console.log("Ready!")
	client.user.setActivity("YOUR MOM")
})

// on commands call
client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const { commandName, options } = interaction
		if (commandName === "echo") {
			//if (interaction.user.id != 601821309881810973) return
			if (!isPerm(interaction)) {
				interaction.reply({ content: "NO fuck you", ephemeral: true })
				return
			}
			const message = options.getString("text")
			console.log(`${interaction.user.username} say ${message}`)
			const channel =
				(await options.getChannel("channel")) != undefined
					? options.getChannel("channel")
					: interaction.channel

			if (options.getString("message")) {
				;(
					await getMessage(
						interaction.channel,
						options.getString("message")
					)
				).reply(message)
			} else {
				channel.send(message)
			}

			await interaction.reply({
				content: "Sent",
				ephemeral: true,
			})
		} else if (commandName === "set-code") {
			var temp = ""
			Object.keys(setList).forEach((key) => {
				temp += `**${key}**: ${setList[key].name}${
					setList[key].type == "modifier" ? " (Modifier)" : ""
				}\n`
			})
			await interaction.reply(
				`Possible set code for searching:\n\n${temp}\nModifier can be add infront of set code to modify the output`
			)
		} else if (commandName === "ping") {
			await interaction.reply(
				randInt(1, 4) == 4
					? randomChoice([
							"Mike, If you are reading this, you've been in a coma for 5 years, we're trying a new technique, please, wake up.",
							"Something Something",
							"Soon",
							"We been trying to reach you about your car extended warrenty",
							"babe wake up the bot is online",
							"I'm doing your mom at this very instance",
							"What did I miss",
							"New update in sometime",
							"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
							"https://www.youtube.com/watch?v=b7vWLz9iGsk",
							"I don't know who you are. I don't know what you want. If you are looking for ransom I can tell you I don't have money, but what I do have are a very particular set of skills. Skills I have acquired over a very long career. Skills that make me a nightmare for people like you. If you let my daughter go now that'll be the end of it. I will not look for you, I will not pursue you, but if you don't, I will look for you, I will find you and I will kill you.",
							"Stoat is not dense >:(",
					  ])
					: "Pong!"
			)
		} else if (commandName === "restart") {
			if (isPerm(interaction)) {
				await interaction.reply(
					randomChoice([
						"Restarting...",
						"AAAAAAAAAAAAAAAAAAAAAAAA",
						"No father don't kill me",
					])
				)
				throw new Error("death")
			} else await interaction.reply("no")
		} else if (commandName === "draft") {
			// grab the important shit
			const set = options.getString("set") // get the set
			const deckSize = options.getInteger("size") // size of deck
				? options.getInteger("size")
				: 20
			const pool = listDiff(
				setsCardPool[set],
				[]
					.concat(
						options.getBoolean("beast") ? setsBeastPool[set] : []
					)
					.concat(
						options.getBoolean("undead") ? setsUndeadPool[set] : []
					)
					.concat(options.getBoolean("tech") ? setsTechPool[set] : [])
					.concat(
						options.getBoolean("magick") ? setsMagickPool[set] : []
					)
			) // load the pool by adding in the selected type pool

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
					listDiff(
						listDiff(pool, setsRarePool[set]),
						setsBanPool[set]
					),
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
				// sort the pack by rare first then alphabetical
				pack.sort((a, b) =>
					a.rare ? -1 : b.rare ? 1 : a.name.localeCompare(b.name)
				)

				//adding in wild if duplicate is found
				if (pack.length < 5) {
					// for every duplicate add in a different one
					for (let card = 0; card < 5 - pack.length; card++) {
						// get a new card by subtracting the already found pool and the full pool
						const newCard = randomChoice(
							listDiff(
								listDiff(
									listDiff(pool, setsRarePool[set]),
									setsBanPool[set]
								),
								temp
							)
						)

						// add it in
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
							? getEmoji(card.atkspecial)
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

				// load the deck list
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

				// print it out
				for (const card of Object.keys(temp)) {
					deckStr += `${temp[card]}x | ${card}\n`
				}

				// add it into embed
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

				if (flag) {
					await interaction.editReply({
						content: `Error: ${coloredString(
							`$$r${error}`
						)}\nCurrent deck: ${deck.cards.join(
							", "
						)}\n\nCurrent Deck Json: \`${JSON.stringify(deck)}\``,
						embeds: [],
						components: [],
					})
					break
				}
			}

			if (flag) return

			await interaction.editReply({
				content: `${
					wildCount > 0
						? `**You have ${wildCount} Wild Card. You can replace them with any common card**\n`
						: ""
				}Completed Deck: ${deck.cards.join(
					", "
				)}\n\nDeck Json: \`${JSON.stringify(deck)}\``,
				embeds: [],
				components: [],
			})
		} else if (commandName === "deck-sim") {
			let fullDeck = []
			let fullSide = []
			if (options.getAttachment("deck-file")) {
				const deckFile = JSON.parse(
					await (
						await fetch(options.getAttachment("deck-file").url)
					).text()
				)
				fullDeck = deckFile.cards
				if (deckFile.side_deck_cards) {
					fullSide = deckFile.side_deck_cards
				} else if (deckFile.side_deck_cat) {
					fullSide = Array(
						setsData.competitive.side_decks[deckFile.side_deck]
							.cards[deckFile.side_deck_cat].count
					).fill(
						setsData.competitive.side_decks[deckFile.side_deck]
							.cards[deckFile.side_deck_cat].card
					)
				} else {
					fullSide = Array(
						setsData.competitive.side_decks[deckFile.side_deck]
							.count
					).fill(
						setsData.competitive.side_decks[deckFile.side_deck].card
					)
				}
			} else if (options.getString("deck-list")) {
				let temp = options.getString("deck-list").split(";")
				temp = temp.map((i) => i.split(","))
				fullDeck = temp[0]
				fullSide = temp[1] ? temp[1] : []
			} else {
				await interaction.reply("Deck missing")
				return
			}

			let currDeck = JSON.parse(JSON.stringify(fullDeck))
			let currSide = JSON.parse(JSON.stringify(fullSide))

			const message = await interaction.reply({
				content: "Doing stuff please wait",
				fetchReply: true,
			})
			let stillRunning = true
			const detailMode = options.getBoolean("detail")

			let hand = drawList(currDeck, 3)

			while (stillRunning) {
				let tempstr = ""
				let currDup = countDeckDup(hand)
				Object.keys(currDup).forEach((c) => {
					tempstr += `${currDup[c]}x ${c}\n`
				})

				let embed = new EmbedBuilder()
					.setColor(Colors.Orange)
					.setTitle("Thingy")
					.setDescription(
						`Card left in Main Deck: ${currDeck.length}\nCard left in Side Deck: ${currSide.length}`
					)
					.addFields({
						name: "====== HAND ======",
						value: tempstr,
						inline: true,
					})

				if (detailMode) {
					tempstr = ""
					let currDup = countDeckDup(currDeck)
					let fullDup = countDeckDup(fullDeck)
					Object.keys(currDup).forEach((c) => {
						const percentage = (currDup[c] / currDeck.length) * 100
						tempstr += `${currDup[c]}/${
							fullDup[c]
						}) ${c} (${Math.round(percentage)}%)\n`
					})
					if (tempstr === "") {
						tempstr += "No Card Left"
					}
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
								.setLabel("Draw Main")
								.setStyle(ButtonStyle.Success)
								.setCustomId("main"),
							new ButtonBuilder()
								.setLabel("Draw Side")
								.setStyle(ButtonStyle.Secondary)
								.setCustomId("side"),
							new ButtonBuilder()
								.setLabel("Create Card")
								.setStyle(ButtonStyle.Secondary)
								.setCustomId("create"),
							new ButtonBuilder()
								.setLabel("Fetch Card")
								.setStyle(ButtonStyle.Secondary)
								.setCustomId("fetch"),
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
						time: 180000,
						filter,
					})
					.then(async (inter) => {
						if (inter.customId === "main") {
							currDup = drawList(currDeck, 1)[0]
							if (currDup) {
								hand.push(currDup)
								await inter.update(`You've drawn ${currDup}`)
							} else {
								await inter.update(`Main is Empty`)
							}
						} else if (inter.customId === "side") {
							currDup = drawList(currSide, 1)[0]
							if (currDup) {
								hand.push(currDup)
								await inter.update(`You've drawn ${currDup}`)
							} else {
								await inter.update(`Side is Empty`)
							}
						} else if (inter.customId === "play") {
							hand.splice(hand.indexOf(inter.values[0]), 1)
							await inter.update(`Played ${inter.values[0]}`)
						} else if (inter.customId === "create") {
							// Create the modal
							const modal = new ModalBuilder()
								.setCustomId("create")
								.setTitle("Create Card")

							// Add components to modal
							modal.addComponents(
								new ActionRowBuilder().addComponents(
									new TextInputBuilder()
										.setLabel(
											"What card do you want to create"
										)
										.setPlaceholder("Enter Card Name!")
										.setStyle(TextInputStyle.Short)
										.setCustomId("card")
								)
							)

							// Show the modal to the user
							await inter.showModal(modal)

							await inter
								.awaitModalSubmit({ time: 10000, filter })
								.then(async (i) => {
									hand.push(
										i.fields.getTextInputValue("card")
									)
									await i.update(
										`Created ${i.fields.getTextInputValue(
											"card"
										)}`
									)
								})
								.catch((e) => inter.update())
						} else if (inter.customId === "fetch") {
							// Create the modal
							const modal = new ModalBuilder()
								.setCustomId("fetch")
								.setTitle("Fetch Card")

							// Add components to modal
							modal.addComponents(
								new ActionRowBuilder().addComponents(
									new TextInputBuilder()
										.setLabel(
											"Card in deck (not to be edit)"
										)
										.setValue(
											[...new Set(currDeck)].join("\n")
										)
										.setStyle(TextInputStyle.Paragraph)
										.setCustomId("eeeee")
										.setRequired(false)
								),
								new ActionRowBuilder().addComponents(
									new TextInputBuilder()
										.setLabel(
											"What card do you want to fetch"
										)
										.setPlaceholder("Enter Card Name!")
										.setStyle(TextInputStyle.Short)
										.setCustomId("card")
										.setRequired(true)
								)
							)

							// Show the modal to the user
							await inter.showModal(modal)

							await inter
								.awaitModalSubmit({ time: 10000, filter })
								.then(async (i) => {
									if (currDeck.length > 1) {
										const bestMatch =
											StringSimilarity.findBestMatch(
												i.fields
													.getTextInputValue("card")
													.toLowerCase(),
												currDeck
											)
										hand.push(
											currDeck[bestMatch.bestMatchIndex]
										)
										currDeck.splice(
											bestMatch.bestMatchIndex,
											1
										)

										await i.update(
											`Fetched ${bestMatch.bestMatch.target}`
										)
									} else {
										await i.update("")
									}
								})
						} else if (inter.customId === "end") {
							stillRunning = false
							await inter.update("")
						}
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
				components: [],
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
					options.getString("string"),
					true
				)}\\\`\\\`\\\`\n\nThe output will be like this:\n${coloredString(
					options.getString("string")
				)}`,
				ephemeral: true,
			})
		} else if (commandName === "guess-the-card") {
			// TODO filter the list instead of this abomnination
			const card = (() => {
				while (true) {
					let c = randomChoice(
						setsData[options.getString("set")].cards
					)
					if (
						options.getString("set") == "augmented" &&
						c.art != "Done"
					) {
						continue
					}
					return c
				}
			})()
			console.log(card.name)
			// get the card picture
			const cardPortrait = await Canvas.loadImage(
				options.getString("set") == "augmented"
					? `https://github.com/answearingmachine/card-printer/raw/main/art/${card.name.replaceAll(
							" ",
							"%20"
					  )}.png`
					: `https://github.com/107zxz/inscr-onln/raw/main/gfx/pixport/${card.name.replaceAll(
							" ",
							"%20"
					  )}.png`
			)

			if (options.getString("set") == "augmented") {
				var bg = await Canvas.loadImage(
					`https://github.com/answearingmachine/card-printer/raw/main/bg/bg_${
						["Common", "Uncommon", "Side Deck"].includes(card.tier)
							? "common"
							: "rare"
					}_${card.temple.toLowerCase()}.png`
				)
			}

			let portrait
			let full

			if (options.getSubcommand() === "normal") {
				const percentage = options.getInteger("difficulty")
					? options.getInteger("difficulty")
					: options.getInteger("size")
					? options.getInteger("size")
					: 35

				const width = clamp(
					Math.floor((cardPortrait.width * percentage) / 100),
					1,
					cardPortrait.width
				)
				const height = clamp(width, 1, cardPortrait.height)

				const scale = 50

				// get the first crop point
				const startCropPos = [
					randInt(0, cardPortrait.width - width),
					randInt(0, cardPortrait.height - height),
				]

				// make the canvas
				portrait = Canvas.createCanvas(width * scale, height * scale)

				let context = portrait.getContext("2d")

				context.imageSmoothingEnabled = false
				if (bg)
					context.drawImage(
						bg,
						startCropPos[0],
						startCropPos[1],
						width,
						height,
						0,
						0,
						portrait.width,
						portrait.height
					)
				context.drawImage(
					cardPortrait,
					// source region
					startCropPos[0],
					startCropPos[1],

					// size of the crop region
					width,
					height,

					// position to place the region to
					0,
					0,

					// size of the final
					portrait.width,
					portrait.height
				)

				// create full version canvas
				full = Canvas.createCanvas(
					cardPortrait.width * scale,
					cardPortrait.height * scale
				)

				context = full.getContext("2d")

				context.imageSmoothingEnabled = false

				// draw the portrait
				if (bg) context.drawImage(bg, 0, 0, full.width, full.height)
				context.drawImage(cardPortrait, 0, 0, full.width, full.height)

				// set the color and size of the box
				context.strokeStyle = "#f00524"
				context.lineWidth = full.width * (0.5 / 100)

				// draw the box
				context.strokeRect(
					startCropPos[0] * scale,
					startCropPos[1] * scale,
					width * scale,
					height * scale
				)
			} else if (options.getSubcommand() === "scramble") {
				const scale = 50
				// grab the column
				const col = parseInt(
					(options.getString("difficulty")
						? options.getString("difficulty")
						: options.getString("size")
						? options.getString("size")
						: "5,3"
					).split(",")[0]
				)

				//grab the row
				const row = parseInt(
					(options.getString("difficulty")
						? options.getString("difficulty")
						: options.getString("size")
						? options.getString("size")
						: "5,3"
					).split(",")[1]
				)

				// get each piece height and width
				const pieceWidth = cardPortrait.width / col
				const pieceHeight = cardPortrait.height / row

				// make the canvas
				portrait = Canvas.createCanvas(
					cardPortrait.width * scale,
					cardPortrait.height * scale
				)

				let context = portrait.getContext("2d")

				context.imageSmoothingEnabled = false

				let i = 0
				// make an array with all the position to grab piece from

				// list comprehension and shuffle it
				// [[i, j] for i in range(row) for j in range(col)]
				let lst = shuffleList(
					(() => {
						let out = []
						;[...Array(row).keys()].forEach((i) =>
							[...Array(col).keys()].forEach((j) =>
								out.push([i, j])
							)
						)
						return out
					})()
				)

				// for all the piece
				for (let x = 0; x < col; x++) {
					for (let y = 0; y < row; y++) {
						if (bg) {
							context.drawImage(
								bg,
								pieceWidth * lst[i][1],
								pieceHeight * lst[i][0],
								pieceWidth,
								pieceHeight,
								pieceWidth * scale * x,
								pieceHeight * scale * y,
								pieceWidth * scale,
								pieceHeight * scale
							)
						}
						context.drawImage(
							cardPortrait,
							pieceWidth * lst[i][1],
							pieceHeight * lst[i][0],
							pieceWidth,
							pieceHeight,
							pieceWidth * scale * x,
							pieceHeight * scale * y,
							pieceWidth * scale,
							pieceHeight * scale
						)

						i++
					}
				}

				full = Canvas.createCanvas(
					cardPortrait.width * scale,
					cardPortrait.height * scale
				)

				context = full.getContext("2d")

				context.imageSmoothingEnabled = false
				if (bg) context.drawImage(bg, 0, 0, full.width, full.height)
				context.drawImage(cardPortrait, 0, 0, full.width, full.height)
			}

			const message = await interaction.reply({
				content:
					"What card is this? Press the `Guess` button and submit the modal to guess",
				files: [new AttachmentBuilder(await portrait.encode("png"))],
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setCustomId("guess")
							.setLabel("Guess")
							.setStyle(ButtonStyle.Primary)
					),
				],
				fetchReply: true,
			})

			const filter = (i) => i.user.id === interaction.user.id

			await message
				.awaitMessageComponent({ time: 180000, filter })
				.then(async (inter) => {
					const modal = new ModalBuilder()
						.setCustomId("guessModal")
						.setTitle("Enter your guess below")

					modal.addComponents(
						new ActionRowBuilder().addComponents(
							new TextInputBuilder()
								.setCustomId("guess")
								.setLabel("What is the card?")
								.setPlaceholder("Card name here")
								.setRequired(true)
								.setStyle(TextInputStyle.Short)
						)
					)
					await inter.showModal(modal)

					await inter
						.awaitModalSubmit({ time: 120000, filter })
						.then(async (i) => {
							if (
								StringSimilarity.compareTwoStrings(
									card.name.toLowerCase(),
									i.fields
										.getTextInputValue("guess")
										.toLowerCase()
								) >= 0.4
							) {
								await i.update({
									content: `Your guess (${i.fields.getTextInputValue(
										"guess"
									)}) was correct`,
									files: [
										new AttachmentBuilder(
											await full.encode("png")
										),
									],
									components: [],
								})
							} else {
								await i.update({
									content: `Your guess (${i.fields.getTextInputValue(
										"guess"
									)}) was incorrect. The card was ${
										card.name
									}`,
									files: [
										new AttachmentBuilder(
											await full.encode("png")
										),
									],
									components: [],
								})
							}
						})
				})
				.catch(
					async (e) =>
						await interaction.editReply(
							`Error: ${coloredString(`$$r${e}`)}`
						)
				)
		} else if (commandName === "retry") {
			await messageSearch(
				await interaction.channel.messages.fetch(
					options.getString("message")
				)
			)
			await interaction.reply({ content: "Retried", ephemeral: true })
		} else if (commandName === "react") {
			;(
				await getMessage(
					interaction.channel,
					options.getString("message")
				)
			).react(options.getString("emoji"))
			await interaction.reply({ content: "Reacted", ephemeral: true })
		} else if (commandName === "test") {
			const message = await interaction.reply({
				content: "hello",
				fetchReply: true,
			})
			await message.reply({
				content: "test",
				components: [
					new ActionRowBuilder().addComponents(
						new ButtonBuilder()
							.setLabel("Test")
							.setCustomId("test")
							.setStyle(ButtonStyle.Primary)
					),
				],
			})
		}
	}
	if (interaction.isButton()) {
		if (interaction.component.customId == "retry") {
			await interaction.update(
				await messageSearch(
					await getMessage(
						interaction.channel,
						interaction.message.reference.messageId
					),
					true
				)
			)
		}
	}
})

// on messages send
client.on(Events.MessageCreate, async (message) => {
	if (message.author.id === clientId) return
	messageSearch(message)
})

client.login(token) // login the bot
