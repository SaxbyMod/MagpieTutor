// import hell
const {
	Client,
	GatewayIntentBits,
	Events,
	EmbedBuilder,
	Colors,
	AttachmentBuilder,
	Partials,
	ActionRowBuilder,
	ComponentType,
	StringSelectMenuBuilder,
	ButtonStyle,
	TextInputBuilder,
	ModalBuilder,
	TextInputStyle,
	MessageFlags,
	PermissionFlagsBits,
	ButtonBuilder,
	MessageAttachment,
	Attachment,
} = require("discord.js")

// specific own module
const StringSimilarity = require("string-similarity")
const scryfall = require("scryfall")
const chalk = require("chalk")
const Canvas = require("@napi-rs/canvas")
const format = require("string-format")

// general module (don;t need installing)
const fetch = require("node-fetch")
const http = require("http")
const fs = require("fs")

const { token, clientId } = require("./config.json")

const sigilList = require("./extra/sigilList.json")

format.extend(String.prototype, {})

const searchRegex = /([^\s]*)\[{2}([^\]]+)\]{2}/g
const queryRegex = /(\w+):(\w+|"[^"]+")/g
const matchPercentage = 0.4
const devMode = false
let log = ""
function debugLog(...str) {
	if (devMode) console.log(...str)
	log += str.join(" ") + "\n"
}
function infoLog(...str) {
	if (!devMode) console.log(...str)
	log += str.join(" ") + "\n"
}

// Chalk color
chalk.orange = chalk.hex("#fb922b")
chalk.pink = chalk.hex("#ff80a4")

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
	let already = []
	for (let choice = 0; choice < num; choice++) {
		let n
		while (true) {
			n = Math.floor(Math.random() * list.length)
			if (already.includes(n)) continue
			break
		}
		out.push(list[n])
		already.push(n)
		if (list.length <= already.length) return out
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

const havePerm = (interaction) =>
	interaction.member.roles.cache.some(
		(role) => role.permission == PermissionFlagsBits.Administrator
	)

const getMessage = async (channel, id) => {
	return await channel.messages.fetch(id)
}

const clamp = (num, min, max) => Math.min(Math.max(num, min), max)
//define the ruleset shit

//define how card should be render
const SetFormatList = {
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
	imfDraft: [
		{ text: "**{name} ", type: "sub" },
		{ text: "[RARE] ", type: "con", con: "card.rare" },
		{ text: "(", type: "normal" },
		{ text: "{blood_cost} Blood", type: "sub" },
		{ text: "{bone_cost} Bone", type: "sub" },
		{ text: "{energy_cost} Energy", type: "sub" },
		{ text: "{mox_cost}", type: "mox" },
		{ text: ")**\n", type: "normal" },
		{
			text: "Stat: {s}\n",
			type: "stat",
			attackVar: "attack",
			healthVar: "health",
		},
		{ text: "Sigils: {s}", type: "list", var: "sigils" },
	],
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
	augmentedDraft: [
		{ text: "**{name} ", type: "sub" },
		{ text: "[{tier}] ", type: "sub" },
		{ text: "(", type: "normal" },
		{ text: "{blood} Blood", type: "sub" },
		{ text: "{bone} Bone", type: "sub" },
		{ text: "{energy} Energy", type: "sub" },
		{ text: "{mox}", type: "mox" },
		{ text: "{shattered}", type: "mox" },
		{ text: ")** | ", type: "normal" },
		{
			text: "Stat: {s} | ",
			type: "stat",
			attackVar: "attack",
			healthVar: "health",
		},
		{ text: "Sigils: {s}", type: "list", var: "sigils" },
		{ text: "Traits: {s}", type: "list", var: "traits" },
	],
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

// const for what a imf pool look like
const ImfPool = [
	{ name: "ban", condition: "card.ban" },
	{ name: "rare", condition: "card.rare" },
	{ name: "beast", condition: "card.blood_cost" },
	{ name: "undead", condition: "card.bone_cost" },
	{ name: "tech", condition: "card.energy_cost" },
	{
		name: "magick",
		condition: "card.mox_cost || specialMagick.includes(card.name)",
	},
	{ name: "common", condition: "!card.rare" },
]

//structure of a pack for drafting
const PackStructure = {
	imf: [
		{ type: "rare", amount: 1, replacement: "common" },
		{ type: "common", amount: 4 },
		{ type: "ban", amount: 0 },
	],
	augmented: [
		{ type: "talk", amount: 1, replacement: "rare" },
		{ type: "rare", amount: 1, replacement: "uncommon" },
		{ type: "uncommon", amount: 2 },
		{ type: "common", amount: 5 },
	],
}

//deck restriction when drafting
const DraftRestriction = {
	imf: {
		rare: { copyPerDeck: 1, uniquePerDeck: Infinity },
		common: { copyPerDeck: 3, uniquePerDeck: Infinity },
	},
	eternal: {
		rare: { copyPerDeck: 1, uniquePerDeck: Infinity },
		common: { copyPerDeck: 3, uniquePerDeck: Infinity },
	},
	augmented: {
		common: { copyPerDeck: 3, uniquePerDeck: Infinity },
		uncommon: { copyPerDeck: 3, uniquePerDeck: Infinity },
		rare: { copyPerDeck: 1, uniquePerDeck: 3 },
		talk: { copyPerDeck: 1, uniquePerDeck: 1 },
	},
}

// list of all the set and their setting
const SetList = {
	//imf set
	".": {
		name: "competitive",
		type: "107",
		format: SetFormatList.imf,
		compactFormat: SetFormatList.imfCompact,
		pools: ImfPool,
		packStructure: PackStructure.imf,
		draftFormat: SetFormatList.imfDraft,
		draftRestriction: DraftRestriction.imf,
	},
	e: {
		name: "eternal",
		type: "url",
		url: "https://raw.githubusercontent.com/EternalHours/EternalFormat/main/IMF_Eternal.json",
		format: SetFormatList.imf,
		compactFormat: SetFormatList.imfCompact,
		pools: ImfPool,
		packStructure: PackStructure.imf,
		draftFormat: SetFormatList.imfDraft,
		draftRestriction: DraftRestriction.eternal,
	},
	v: {
		name: "vanilla",
		type: "107",
		format: SetFormatList.imf,
		compactFormat: SetFormatList.imfCompact,
		pools: ImfPool,
	},
	g: {
		name: "mr.egg",
		type: "url",
		url: "https://raw.githubusercontent.com/senor-huevo/Mr.Egg-s-Goofy/main/Mr.Egg's%20Goofy.json",
		format: SetFormatList.imf,
		compactFormat: SetFormatList.imfCompact,
		pools: ImfPool,
		packStructure: PackStructure.imf,
		draftFormat: SetFormatList.imfDraft,
		draftRestriction: DraftRestriction.imf,
	},

	//other set
	a: {
		name: "augmented",
		type: "specialLoad",
		format: SetFormatList.augmented,
		compactFormat: SetFormatList.augmentedCompact,
		file: "./extra/augmentedProcess.js",
		pools: [
			{ name: "common", condition: 'card.tier == "Common"' },
			{ name: "uncommon", condition: 'card.tier == "Uncommon"' },
			{ name: "rare", condition: 'card.tier == "Rare"' },
			{ name: "talk", condition: 'card.tier == "Talking"' },
			{ name: "side", condition: 'card.tier == "Side Deck"' },
		],
		packStructure: PackStructure.augmented,
		draftFormat: SetFormatList.augmentedDraft,
		draftRestriction: DraftRestriction.augmented,
	},
	r: {
		name: "redux",
		type: "specialLoad",
		format: SetFormatList.redux,
		compactFormat: SetFormatList.redux,
		file: "./extra/reduxProcess.js",
		pools: ImfPool,
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
	p: {
		name: "no portrait",
		type: "modifier",
	},
	s: {
		name: "sigil",
		type: "modifier",
	},
	"`": {
		name: "no search",
		type: "modifier",
	},
	q: {
		name: "query",
		type: "modifier",
	},
}

let setsData = {}

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
infoLog(chalk.magenta.underline.bold("Setup please wait"))
;(async () => {
	const startSetup = performance.now()
	infoLog(chalk.magenta.underline.bold("Loading set data..."))
	//fetch all the set json
	for (const set of Object.values(SetList)) {
		const start = performance.now()
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
		} else if (set.type == "url") {
			try {
				await fetch(set.url)
					.then((res) => res.json())
					.then((json) => {
						setsData[set.name] = json
					})
			} catch (err) {
				infoLog(chalk.bgRed("ETERNAL MESS UP THE JSON AGAIN!!!"))
				infoLog(chalk.pink.background(err))
				setsData[set.name] = JSON.parse(
					JSON.stringify(setsData["competitive"])
				)
			}
		}
		// TODO temporary solution pls fix later
		if (set.type == "107" || set.type == "url")
			setsData[set.name].sigils = sigilList
		const cardCount = setsData[set.name]
			? setsData[set.name].cards.length
			: 0
		infoLog(
			chalk.blue(
				`Set ${chalk.green.bold(
					set.name
				)} loaded! with set code "${chalk.orange.bold(
					Object.keys(SetList).find((key) => SetList[key] === set)
				)}"${
					setsData[set.name]
						? ` and ${chalk[
								cardCount > 300
									? "red"
									: cardCount > 100
									? "yellow"
									: "green"
						  ](cardCount)} cards`
						: ""
				} (${chalk.red(
					`load times: ${(performance.now() - start).toFixed(1)} ms`
				)})`
			)
		)
	}
	infoLog(
		chalk.red(
			`Loading set data took: ${(performance.now() - startSetup).toFixed(
				1
			)}ms`
		)
	)
	// loading all the card pool
	infoLog(chalk.magenta.underline.bold("Loading card pools..."))
	for (const setName of Object.keys(setsData)) {
		infoLog(chalk.yellow(`Loading ${setName} pools`))
		setsData[setName].pools = {}
		let temp = {}
		for (const card of setsData[setName].cards) {
			const name = card.name.toLowerCase()
			temp[name] = card

			for (const poolType of Object.values(SetList).find(
				(i) => i.name == setName
			).pools) {
				if (!setsData[setName].pools[poolType.name])
					setsData[setName].pools[poolType.name] = []
				if (eval(poolType.condition))
					setsData[setName].pools[poolType.name].push(name)
			}
		}
		setsData[setName].cards = temp
		infoLog(
			chalk.green(
				`Finish loading ${setName} pools. Loaded ${chalk.blue(
					Object.keys(setsData[setName].pools).length
				)} pools with ${Object.values(setsData[setName].pools)
					.map((p) =>
						p.length > 50
							? chalk.red(p.length)
							: p.length > 25
							? chalk.yellow(p.length)
							: chalk.green(p.length)
					)
					.join(", ")} cards. Pool names: ${chalk.pink(
					Object.keys(setsData[setName].pools).join(", ")
				)}`
			)
		)
	}
	infoLog(
		chalk.red(
			`Setup took: ${(performance.now() - startSetup).toFixed(1)}ms`
		)
	)

	debugLog("Setup completed")

	if (!client.isReady()) return
	console.log(
		chalk.bgGreen.black(
			"Setup is complete and bot is connected to Discord's sever"
		)
	)
	const servers = Array.from(client.guilds.cache).map((s) => s[1].name)
	infoLog(chalk.cyan(`Bot is in ${servers.length} server`))
	infoLog(chalk.cyan(`Servers: ${chalk.yellow(servers.join(", "))}`))
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

const queryKeywordList = {
	sigil: {
		alias: ["s"],
		description: "Filter for a sigils",
		callback: (value, set, filterPossibleValue) => {
			filterPossibleValue(([name, info]) =>
				info.sigils
					? StringSimilarity.findBestMatch(
							value,
							info.sigils.map((s) => s.toLowerCase())
					  ).bestMatch.rating >= 0.8
					: false
			)
		},
	},
	effect: {
		alias: ["e"],
		description: "Filter for a sigil effect",
		callback: (value, set, filterPossibleValue) => {
			filterPossibleValue(([name, info]) => {
				if (!info.sigils) return false
				let flag = false
				info.sigils.forEach((sigil) => {
					if (setsData[set.name].sigils[sigil].includes(value))
						flag = true
				})
				return flag
			})
		},
	},
	description: {
		alias: ["d"],
		description: "Filter for a description",
		callback: (value, set, filterPossibleValue) => {
			filterPossibleValue(([name, info]) => {
				if (!info.description) return false
				return info.description.includes(value)
			})
		},
	},
	resourcecost: {
		alias: ["rc"],
		description:
			"Filter for resource cost (crc). Can compare with numeric expression (`>`,`>=`, etc.)",
		callback: (value, set, filterPossibleValue) => {
			const op = value.includes(">=")
				? ">="
				: value.includes("<=")
				? "<="
				: value.includes(">")
				? ">"
				: value.includes("<")
				? "<"
				: "=="
			value = value
				.replaceAll("<", "")
				.replaceAll(">", "")
				.replaceAll("=", "")
			filterPossibleValue(
				([name, info]) =>
					eval(`${info.blood_cost}${op}${value}`) ||
					eval(`${info.bone_cost}${op}${value}`) ||
					eval(`${info.energy_cost}${op}${value}`) ||
					eval(
						`${
							info.mox_cost || info.mox
								? info[
										set.name == "augmeted"
											? "mox"
											: "mox_cost"
								  ].length
								: undefined
						}${op}${value}`
					) ||
					eval(
						`${
							info.shattered ? info.shattered.length : undefined
						}${op}${value}`
					)
			)
		},
	},
	convertedresourcecost: {
		alias: ["crc"],
		description:
			"Filter for converted resource cost (crc). Can compare with numeric expression (`>`,`>=`, etc.)",
		callback: (value, set, filterPossibleValue) => {
			const op = value.includes(">=")
				? ">="
				: value.includes("<=")
				? "<="
				: value.includes(">")
				? ">"
				: value.includes("<")
				? "<"
				: "=="
			value = value
				.replaceAll("<", "")
				.replaceAll(">", "")
				.replaceAll("=", "")
			filterPossibleValue(([name, info]) =>
				eval(
					`${
						(info.blood_cost ? info.blood_cost : 0) +
						(info.bone_cost ? info.bone_cost : 0) +
						(info.energy_cost ? info.energy_cost : 0) +
						(info.mox_cost || info.mox
							? info[set.name == "augmeted" ? "mox" : "mox_cost"]
									.length
							: 0) +
						(info.shattered ? info.shattered.length : 0)
					}${op}${value}`
				)
			)
		},
	},
	resourcetype: {
		alias: ["rt"],
		description:
			"Filter for resource type. Possible resource: base game resource  (`blood`, `bone`, etc.) and custom resource (`shattered`) and first character of resource name (`o` for bone instead)",
		callback: (value, set, filterPossibleValue) => {
			const type =
				value == "b" || value == "blood"
					? set.name == "augmented"
						? "blood"
						: "blood_cost"
					: value == "o" || value == "bone"
					? set.name == "augmented"
						? "bone"
						: "bone_cost"
					: value == "e" || value == "energy"
					? set.name == "augmented"
						? "energy"
						: "energy_cost"
					: value == "m" || value == "mox"
					? set.name == "augmented"
						? "mox"
						: "mox_cost"
					: value == "s" || value == "shattered"
					? "shattered"
					: ""
			filterPossibleValue(([name, info]) => info[type])
		},
	},
	color: {
		alias: ["c"],
		description:
			"Filter for mox color. Possible color: base game mox color (`green`, `orange`, etc.), custom color (`colorless`), base game gem name (`emerald`, `ruby`, etc.) and custom gem name (`prism`)",
		callback: (value, set, filterPossibleValue) => {
			const color =
				value == "g" ||
				value == "green" ||
				value == "e" ||
				value == "emerald"
					? set.name == "augmented"
						? "emerald"
						: "Green"
					: value == "o" ||
					  value == "orange" ||
					  value == "r" ||
					  value == "ruby"
					? set.name == "augmented"
						? "ruby"
						: "Orange"
					: value == "b" ||
					  value == "blue" ||
					  value == "s" ||
					  value == "sapphire"
					? set.name == "augmented"
						? "sapphire"
						: "Blue"
					: value == "c" ||
					  value == "colorless" ||
					  value == "p" ||
					  value == "prism"
					? "prism"
					: ""
			// if mox cost exist check for color then if shattered exist also check for color
			// or between mox and shattered
			filterPossibleValue(([name, info]) =>
				info.mox || info.mox_cost
					? info[
							set.name == "augmented" ? "mox" : "mox_cost"
					  ].includes(color)
					: false || info.shattered
					? info.shattered.includes(`shattered_${color}`)
					: false
			)
		},
	},
	temple: {
		alias: ["t"],
		description:
			"Filter for temple. Possible temple: base game temple (`beast`, `undead`, etc.)",
		callback: (value, set, filterPossibleValue) => {
			const temple =
				value == "b" || value == "beast"
					? "Beast"
					: value == "u" || value == "undead"
					? "Undead"
					: value == "t" || value == "technology"
					? "Tech"
					: value == "m" || value == "magick"
					? "Magick"
					: ""
			filterPossibleValue(([name, info]) => info.temple == temple)
		},
	},
	tribe: {
		alias: ["tb"],
		description: "Filter for tribe.",
		callback: (value, set, filterPossibleValue) => {
			filterPossibleValue(([name, info]) => {
				if (!info.tribes) return false
				if (Array.isArray(info.tribes))
					info.tribes = info.tribes.join(" ")
				return info.tribes.toLowerCase().includes(value)
			})
		},
	},
	trait: {
		alias: ["tr"],
		description: "Filter for trait.",
		callback: (value, set, filterPossibleValue) => {
			filterPossibleValue(([name, info]) => {
				if (!info.traits) return false
				return info.traits.includes(value)
			})
		},
	},
	rarity: {
		alias: ["r"],
		description:
			"Filter for rarity/tier. Possible rarity: Possible value: base game rarity  (`common`, `rare`), custom rarity (`uncommon`, `talk`, `side`, etc.) first character of rarity. (`c`, `u`, etc.)",
		callback: (value, set, filterPossibleValue) => {
			const rarity =
				value == "c" || value == "common"
					? set.name == "augmented"
						? "Common"
						: false
					: value == "u" || value == "uncommon"
					? "Uncommon"
					: value == "r" || value == "rare"
					? set.name == "augmented"
						? "Rare"
						: true
					: value == "t" || value == "talk"
					? "Talking"
					: value == "s" || value == "side"
					? "Side Deck"
					: ""
			filterPossibleValue(([name, info]) =>
				set.name == "augmented"
					? info.tier == rarity
					: rarity
					? info.rare
					: !info.rare
			)
		},
	},
	health: {
		alias: ["h"],
		description:
			"Filter for health. Can compare with numeric expression (`>`,`>=`, etc.)",
		callback: (value, set, filterPossibleValue) => {
			const op = value.includes(">=")
				? ">="
				: value.includes("<=")
				? "<="
				: value.includes(">")
				? ">"
				: value.includes("<")
				? "<"
				: "=="
			value = value
				.replaceAll("<", "")
				.replaceAll(">", "")
				.replaceAll("=", "")
			filterPossibleValue(([name, info]) =>
				eval(`${info.health}${op}${value}`)
			)
		},
	},
	power: {
		alias: ["p"],
		description:
			"Filter for power. Can compare with numeric expression (`>`,`>=`, etc.)",
		callback: (value, set, filterPossibleValue) => {
			const op = value.includes(">=")
				? ">="
				: value.includes("<=")
				? "<="
				: value.includes(">")
				? ">"
				: value.includes("<")
				? "<"
				: "=="
			value = value
				.replaceAll("<", "")
				.replaceAll(">", "")
				.replaceAll("=", "")
			filterPossibleValue(([name, info]) =>
				eval(`${info.attack}${op}${value}`)
			)
		},
	},
	is: {
		alias: [],
		description:
			"Filter for type of card. List of nickname can be found [here](https://github.com/khanhfg/MagpieTutor#nicknames)",
		callback: (value, set, filterPossibleValue) => {
			const nicknameList = {
				vanilla: ([name, info]) => !info.sigils,
				tank: ([name, info]) => info.health > 5,
				glass: ([name, info]) => info.attack > info.health,
				square: ([name, info]) => info.attack == info.health,
				reflected: ([name, info]) => info.attack >= info.health,
				traitless: ([name, info]) => !info.traits,
				removal: ([name, info]) => {
					const removalList = [
						"explode bot",
						"strange frog",
						"mrs. bomb",
						"adder",
						"mirrorbot",
						"shutterbug",
						"drowned soul",
						"long elk",
					]
					return removalList.includes(name)
				},
			}
			let callback = nicknameList[value]
			filterPossibleValue(callback ? callback : ([name, info]) => false)
		},
	},
	name: {
		alias: "n",
		description: "Filter for name",
		callback: (value, set, filterPossibleValue) => {
			filterPossibleValue(([name, info]) =>
				name.toLowerCase().includes(value.toLowerCase())
			)
		},
	},
	regex: {
		alias: ["rx"],
		description: "Filter for regex match in name",
		callback: (value, set, filterPossibleValue) => {
			filterPossibleValue(([name, info]) => name.match(value))
		},
	},
}

// function hell
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
	if (!message.content.toLowerCase().match(searchRegex)) {
		return
	}
	console.log(
		chalk.blue(
			`Message with content: "${chalk.green(
				message.content
			)}" in ${chalk.red.bold(
				message.guild.name
			)} detected searching time ${chalk.magenta("OwO")}`
		)
	)
	outer: for (let cardName of message.content
		.toLowerCase()
		.matchAll(searchRegex)) {
		let selectedSet = SetList[cardName[1][0]]
			? SetList[cardName[1][0]]
			: SetList["."]
		let name = cardName[2]
		let card
		let noAlter = false
		let compactDisplay = false
		let noArt = false
		let sigilSearch = false
		let query = false
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
				} else if (selectedSet.name == "no portrait") {
					noArt = true
				} else if (selectedSet.name == "sigil") {
					sigilSearch = true
				} else if (selectedSet.name == "no search") {
					continue outer
				} else if (selectedSet.name == "query") {
					query = true
				}
				cardName[1] = cardName[1].slice(1)
				selectedSet = SetList[cardName[1][0]]
					? SetList[cardName[1][0]]
					: SetList["."]
				continue redo
			}
			break
		}

		let temp

		if (sigilSearch) {
			// get the best match
			const bestMatch = StringSimilarity.findBestMatch(
				name,
				Object.keys(setsData[selectedSet.name].sigils)
			).bestMatch

			if (bestMatch.rating <= matchPercentage) {
				embedList.push(
					new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle(`Sigil "${name}" not found`)
						.setDescription(
							`No Sigil found in selected set (${
								setsData[selectedSet.name].ruleset
							}) that have more than 40% similarity with the search term(${name})`
						)
				)
				continue
			}

			temp = await genSigilEmbed(
				bestMatch.target,
				setsData[selectedSet.name].sigils[bestMatch.target]
			)
		} else if (query) {
			temp = queryCard(name, selectedSet, compactDisplay)
		} else {
			// get the best match
			const bestMatch = StringSimilarity.findBestMatch(
				name,
				Object.keys(setsData[selectedSet.name].cards)
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
				card = await fetchCard(
					bestMatch.target,
					selectedSet.name,
					noAlter,
					noArt
				)
			}

			temp = await genCardEmbed(card, compactDisplay)
		}
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

	const end = performance.now()

	if (msg != "") replyOption["content"] = msg
	if (embedList.length > 0) replyOption["embeds"] = embedList
	if (attachmentList.length > 0) replyOption["files"] = attachmentList
	if (
		replyOption["content"] ||
		replyOption["embeds"] ||
		replyOption["files"]
	) {
		replyOption["content"] =
			(replyOption["content"] ? replyOption["content"] : "") +
			`Search for complete in ${Math.round((end - start) * 10) / 10}ms`
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
async function fetchCard(name, setName, noAlter = false, noArt = false) {
	let card

	let set = setsData[setName]

	card = set.cards[name]
	// look for the card in the set

	if (!card) return card

	card.set = setName
	if (card.noArt || noArt) {
		card.url = undefined
	} else if (card.pixport_url) {
		card.url = card.pixport_url
	} else {
		if (card.set == SetList.a.name) {
			card.url = `https://github.com/answearingmachine/card-printer/raw/main/dist/printer/assets/art/${card.name.replaceAll(
				" ",
				"%20"
			)}.png`
		} else {
			card.url = `https://github.com/107zxz/inscr-onln/raw/main/gfx/pixport/${card.name.replaceAll(
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

		card.name = "GAY DRAGON"
		card.description = "Modified portrait by ener"
	} else if (card.name == "Horse Mage") {
		card.description = `Not make by ener :trolled:`
	} else if (card.name == "The Moon") {
		card.sigils = [
			"Omni Strike",
			"Tidal Lock",
			"Made of Stone",
			"Mighty Leap",
		]
	} else if (card.name == "Adder") {
		card.name = "peak"
		card.description = "peak"
		card.sigils = Array(6).fill("Handy")
	} else if (card.name == "Squirrel Ball") {
		card.description =
			"Remember that face when you arrive in hell - Squidman005#8375 the Squirrel Ball Man"
	} else if (card.name == "Ouroboros") {
		card.description = "Ouroboros is the source of all evil - 107"
	} else if (card.name == "Master Orlu") {
		card.description = undefined
	} else if (card.name == "Blue Mage") {
		card.url =
			"https://cdn.discordapp.com/attachments/1013090988354457671/1130690799152148571/11111.jpg"
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
			if (card.set == SetList.a.name) {
				context.drawImage(
					await Canvas.loadImage(
						`https://github.com/answearingmachine/card-printer/raw/main/dist/printer/assets/bg/bg_${
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
		Object.values(SetList).find((set) => set.name == card.set)[
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

async function genSigilEmbed(sigilName, sigilDescription) {
	let embed = new EmbedBuilder()
		.setColor(Colors.Aqua)
		.setTitle(`${sigilName}`)
		.setDescription(sigilDescription)
	return [embed, 1]
}

function queryCard(string, set, compactDisplay = false) {
	let embed = new EmbedBuilder().setColor(Colors.Fuchsia)
	let possibleMatches = setsData[set.name].cards

	for (const tag of string.matchAll(queryRegex)) {
		let type = tag[1],
			value = tag[2].replaceAll('"', "")

		const filterPossibleValue = (callback) => {
			possibleMatches = Object.fromEntries(
				Object.entries(possibleMatches).filter(callback)
			)
		}

		for (const [key, keyInfo] of Object.entries(queryKeywordList)) {
			if (type == key || keyInfo.alias.includes(type)) {
				keyInfo.callback(value, set, filterPossibleValue)
			}
		}
	}
	const final = Object.keys(possibleMatches)
	embed.setTitle(
		`Result: ${final.length} cards found in ${setsData[set.name].ruleset}`
	)
	embed.setDescription(
		compactDisplay
			? "Result hidden by compact mode"
			: final.length > 0
			? final.join(", ").length > 4096
				? "Too many result, please be more specific"
				: final
						.join(", ")
						.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
			: "No card found"
	)
	return [embed, 1]
}

// on ready call
client.once(Events.ClientReady, () => {
	console.log(
		chalk.bgRed(
			"Bot connected to Discord's server but wait until set up is complete to use"
		)
	)
	client.user.setActivity("YOUR MOM")
})

// on commands call
client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const { commandName, options } = interaction
		if (commandName === "echo") {
			//if (interaction.user.id != 601821309881810973) return
			if (!(isPerm(interaction) && havePerm(interaction))) {
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
			Object.keys(SetList).forEach((key) => {
				temp += `**${key}**: ${SetList[key].name}${
					SetList[key].type == "modifier" ? " (Modifier)" : ""
				}\n`
			})
			await interaction.reply(
				`Possible set code for searching:\n\n${temp}\nModifier can be add infront of set code to modify the output. Ex: \`se\` will look up a sigil in the Eternal set`
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
			const setName = options.getString("set") // get the set name
			const set = Object.values(SetList).find((v) => v.name == setName)
			const deckSize = options.getInteger("size") // get deck size
				? options.getInteger("size")
				: 20

			const message = await interaction.reply({
				content: "Loading...",
				fetchReply: true,
			})

			//get the set pack struture
			const packStructure = set.packStructure

			//fetch only the require card from the pack structure
			const pool = (() => {
				let out = {}
				for (const type of packStructure) {
					if (type.amount == 0) {
						Object.keys(out).forEach((k) => {
							out[k] = listDiff(
								out[k],
								setsData[setName].pools[type.type]
							)
						})
						continue
					}
					out[type.type] = setsData[setName].pools[type.type]
				}
				return out
			})()

			var deck = {
				cards: [],
				side_deck: "10 Squirrel",
			}
			var wildCount = 0
			let flag = false // exit flag
			let deckUniqueCount = {}

			// repeat for deck size
			for (let cycle = 0; cycle < deckSize; cycle++) {
				// putting card name into the pack
				let temp = []

				for (let type of packStructure) {
					// if exclude type skip or pool too small and move on
					if (type.amount == 0) continue
					let amount = type.amount
					//if the pool have 0 card and have a replacement use the replacement
					outer: while (true) {
						if (pool[type.type].length < 1)
							if (type.replacement) {
								type = packStructure.find(
									(t) => t.type == type.replacement
								)
								continue outer
							} else continue
						else {
							break
						}
					}

					if (!temp[type.type]) temp[type.type] = []

					temp[type.type] = temp[type.type].concat(
						randomChoices(pool[type.type], amount)
					)
				}
				//put card data in the pack using
				let pack = []
				for (const type of Object.keys(temp)) {
					for (const name of temp[type]) {
						let card = setsData[setName].cards[name]
						card.type = type
						pack.push(card)
					}
				}

				// if the pack is missing cards push in wild card
				if (
					pack.length <
					packStructure.reduce(
						(partialSum, a) => partialSum + a.amount,
						0
					)
				) {
					pack.push({
						name: "WILD CARD",
						attack: 100,
						health: 100,
					})
				}

				// generating embed and selection
				const embed = new EmbedBuilder()
					.setColor(Colors.Blue)
					.setTitle(
						`Pack Left: ${deckSize - cycle}\nCard in deck: ${
							deck.cards.length
						}\nWild Count: ${wildCount}`
					)

				const selectionList = new StringSelectMenuBuilder()
					.setCustomId("select")
					.setPlaceholder("Select a card!")

				var description = ""

				//generate the pack list
				for (const card of pack) {
					for (let line of set.draftFormat) {
						if (line.type == "sub") {
							if (
								!card[
									line.text.match(/{(\w+)}/g)[0].slice(1, -1)
								]
							)
								continue
							description += line.text.format(card)
						} else if (line.type == "normal") {
							description += line.text
						} else if (line.type == "con") {
							if (eval(line.con)) description += line.text
						} else if (line.type == "mox") {
							if (
								!card[
									line.text.match(/{(\w+)}/g)[0].slice(1, -1)
								]
							)
								continue
							description += line.text.format(card)
						} else if (line.type == "stat") {
							description += line.text.replace(
								"{s}",
								`${
									card.atkspecial
										? `:${card.atkspecial}:`
										: card[line.attackVar]
								} / ${card[line.healthVar]}`
							)
						} else if (line.type == "list") {
							if (!card[line.var]) continue
							description += line.text.replace(
								"{s}",
								card[line.var]
							)
						}
					}
					description += "\n\n"

					// add the card to selection
					selectionList.addOptions({
						label: card.name,
						value: card.name,
					})
				}

				// load the deck dup to check for restriction later
				let deckStr = ""
				let deckDup = countDeckDup(
					deck.cards.sort((a, b) =>
						a.startsWith("*")
							? -1
							: b.startsWith("*")
							? 1
							: a.localeCompare(b)
					)
				)

				// generate the deck preview
				for (const card of Object.keys(deckDup)) {
					deckStr += `${deckDup[card]}x | ${card}\n`
				}

				// add pack and preview into embed
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

				// process the selection
				let error = ""
				await message
					.awaitMessageComponent({
						componentType: ComponentType.StringSelect,
						time: 180000,
						filter,
					})
					.then(async (i) => {
						const card = pack.find((c) => c.name == i.values[0])
						if (card.name == "WILD CARD") {
							wildCount++
						} else {
							deck.cards.push(card.name)
							if (!deckUniqueCount[card.type])
								deckUniqueCount[card.type] = 0
							deckUniqueCount[card.type]++
							if (
								countDeckDup(deck.card) >=
								set.draftRestriction[card.type].copyPerDeck
							) {
								// if more than or equal to the allowed same name copy per deck remove this card from pool
								pool[card.type].splice(
									pool[card.type].indexOf(
										card.name.toLowerCase()
									),
									1
								)
							}
							if (
								deckUniqueCount[card.type] >=
								set.draftRestriction[card.type].uniquePerDeck
							) {
								//if more than or equal to the amount of unique copy remove this pool completely
								pool[card.type] = []
							}
						}
						await i.update("added")
					})
					.catch((err) => {
						flag = true
						error = err
					})

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
					await interaction.reply(
						"Tunnel is up and running. If you have problem connecting, restart the game and try again"
					)
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
					const keys = Object.keys(
						setsData[options.getString("set")].cards
					)
					let c =
						setsData[options.getString("set")].cards[
							keys[(keys.length * Math.random()) << 0]
						]
					if (
						options.getString("set") == "augmented" &&
						c.art != "Done"
					) {
						continue
					}
					return c
				}
			})()
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
		} else if (commandName === "query-info") {
			var temp = ""
			Object.keys(queryKeywordList).forEach((key) => {
				temp += `**${key}** [${queryKeywordList[key].alias}]: ${queryKeywordList[key].description}\n`
			})
			await interaction.reply({
				content: `Possible query keyword for searching:\nHow to read: [keyword name] [keyword alias]: [keyword description]\n\n${temp}\nIf you don't know how query work visit [the documetation](https://github.com/khanhfg/MagpieTutor#query-syntax)`,
				flags: [MessageFlags.SuppressEmbeds],
			})
		} else if (commandName === "test") {
			await interaction.reply("Nothing here don't look into it")
		} else if (commandName === "poll") {
			const pollOption = options.getString("option").split(",")
			const timeEnd = options.getString("time").endsWith("m")
				? parseInt(options.getString("time")) * 60000
				: options.getString("time").endsWith("s")
				? parseInt(options.getString("time")) * 1000
				: options.getString("time")

			const embed = new EmbedBuilder()
				.setColor(Colors.Purple)
				.setTitle(`Poll: ${options.getString("question")}`)
				.setDescription(
					pollOption
						.map((o) => `${pollOption.indexOf(o) + 1}: ${o}`)
						.join("\n")
				)
			const selectMenu = new StringSelectMenuBuilder()
				.setCustomId("pollSelect")
				.setPlaceholder("Choose a option")
			for (const [index, option] of pollOption.entries()) {
				selectMenu.addOptions({
					label: option,
					value: index.toString(),
				})
			}
			const message = await interaction.reply({
				embeds: [embed],
				components: [new ActionRowBuilder().addComponents(selectMenu)],
				fetchReply: true,
			})

			let pollData = require("./extra/poll.json")
			pollData[message.id] = {
				endTime: Date.now() + timeEnd,
				question: options.getString("question"),
				optionResult: pollOption.map((value) => {
					return { option: value, amount: 0 }
				}),
				alreadyVote: [],
			}
			fs.writeFileSync(
				"./extra/poll.json",
				JSON.stringify(pollData),
				"utf8"
			)
		}
	} else if (interaction.isButton()) {
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
	} else if (interaction.isStringSelectMenu()) {
		if (interaction.component.customId == "pollSelect") {
			let fullPollData = require("./extra/poll.json")
			let pollData = fullPollData[interaction.message.id]
			if (Date.now() > pollData.endTime) {
				await interaction.update({
					content: "Poll ended",
					embeds: [
						new EmbedBuilder()
							.setTitle(pollData.question)
							.setDescription(
								`Winner: ${
									pollData.optionResult.sort(
										(a, b) => a.amount - b.amount
									)[0].option
								}`
							),
					],
					components: [],
				})
				delete fullPollData[interaction.message.id]
			} else if (pollData.alreadyVote.includes(interaction.user.id)) {
				await interaction.reply({
					content: "You already voted",
					ephemeral: true,
				})
			} else {
				pollData.optionResult[interaction.values[0]].amount++
				pollData.alreadyVote.push(interaction.user.id)
				await interaction.reply({
					content: "Vote Success",
					ephemeral: true,
				})
			}
			fs.writeFileSync(
				"./extra/poll.json",
				JSON.stringify(fullPollData),
				"utf8"
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
