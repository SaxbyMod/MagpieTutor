const fetch = require("node-fetch")

var imfJson = {
    ruleset: "Stoat Lord Card Thingymagik",
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
