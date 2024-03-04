const fetch = require("node-fetch")

var imfJson = {
    ruleset: "Custom TCG Inscryption",
    cards: [],
    sigils: {},
}

async function load() {
    let cardsRaw
    let sigilRaw
    await fetch("https://opensheet.elk.sh/152SuTx1fVc4zsqL4_zVDPx69sd9vYWikc2Ce9Y5vhJE/1")
        .then((res) => res.json())
        .then((json) => {
            cardsRaw = json
        })

    await fetch("https://opensheet.elk.sh/152SuTx1fVc4zsqL4_zVDPx69sd9vYWikc2Ce9Y5vhJE/2")
        .then((res) => res.json())
        .then((json) => {
            sigilRaw = json
        })
    cardsRaw.pop()
    for (let card of cardsRaw) {
        let cardFormated = {}
        if (Object.keys(card).length == 0) continue
        cardFormated.name = card["Name"]
        cardFormated.temple = card["Temple"]
        cardFormated.tier = card["Rarity"]
        cardFormated.cost = card["Cost"]
        cardFormated.attack = card["Power"]
        cardFormated.health = card["Health"]

        // parsing cost
        card["Cost"] = card["Cost"]
            .replace("bones", "bone")
            .replace("sapphires", "sapphire")
            .replace("rubies", "ruby")
            .replace("prisms", "prism")
        for (let cost of card["Cost"].split(",")) {
            cost = cost.trim().toLowerCase()
            let temp = cost.split(" ")
            if (cost.includes("shattered")) {
                if (!cardFormated["shattered"]) cardFormated["shattered"] = []
                for (let i = 0; i < temp[0]; i++) {
                    cardFormated["shattered"].push(`shattered_${temp[2]}`)
                }
            } else if (["sapphire", "ruby", "emerald", "prism"].some((i) => cost.includes(i))) {
                if (!cardFormated["gem"]) cardFormated["gem"] = []
                for (let i = 0; i < temp[0]; i++) {
                    cardFormated["gem"].push(temp[1])
                }
            } else if (temp.length > 0) {
                cardFormated[temp[1]] = parseInt(temp[0])
            }
        }

        if (card["Token"]) cardFormated["token"] = card["Token"]

        cardFormated["description"] = card["Flavor Text"]

        cardFormated.sigils = [
            card["Sigil 1"] ?? "",
            card["Sigil 2"] ?? "",
            card["Sigil 3"] ?? "",
            card["Sigil 4"] ?? "",
        ]
        cardFormated.sigils = cardFormated.sigils.filter((s) => s !== "")

        cardFormated.pixport_url = card["Image"]
        imfJson.cards.push(cardFormated)
    }

    for (sigil of sigilRaw) {
        if (sigil["Description"]) imfJson.sigils[sigil["Name"]] = sigil["Description"].replaceAll("\n", "")
    }
    return imfJson
}

module.exports = {
    load,
}
