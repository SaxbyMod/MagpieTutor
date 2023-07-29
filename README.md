# MagpieTutor
<a href="https://discord.com/api/oauth2/authorize?client_id=1066417513115697275&permissions=137439333440&scope=applications.commands%20bot">
        <img src="https://img.shields.io/badge/Invite_the_Bot-blue"
            alt="Invite the Bot">
</a>

Scryfall bot but for Inscryption. Currently the bot can look up card in the following [format/set](https://github.com/Mouthless-Stoat/MagpieTutor/wiki/Searching#set-code)

IF you have any request for new set send me a message on discord. `mouthless_stoat`.

## Table of Content
- [MagpieTutor](#magpietutor)
  - [Table of Content](#table-of-content)
  - [How to host the bot yourself](#how-to-host-the-bot-yourself)
  - [Bot Require Permission](#bot-require-permission)
  - [Query Syntax](#query-syntax)
  - [Detail](#detail)
  - [Keywords](#keywords)
    - [Sigil](#sigil)
    - [Sigil Effect](#sigil-effect)
    - [Description](#description)
    - [Resource Cost](#resource-cost)
    - [Resource Type](#resource-type)
    - [Temple](#temple)
    - [Tribe](#tribe)
    - [Trait](#trait)
    - [Rarity](#rarity)
    - [Health](#health)
    - [Power](#power)
    - [Mox Color](#mox-color)
    - [Nicknames](#nicknames)
  - [Todo List](#todo-list)
  - [Plan for next update:](#plan-for-next-update)

## How to host the bot yourself
If you know how to set up a discord bot with discord.js already, then download all the package with `npm setup`, then created a `config.json` with these information: 
```json
{
    "clientId": "Your Client ID here",
    "token": "Your Bot Token here",
}
```
And running `npm start` should start the bot

If you don't know how to setup a discord bot follow these step:
1. Download [Node](https://nodejs.org/en/)
2. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
3. Click on `New Application` in the top right. Give the Application a name (This is not the name of your bot but it recommend to make it the same or similar name as your bot), accept the TOS and create it.
4. Click on the `Bot` menu and choose `Add Bot`, you can change the name of the bot if you want here.
5. Click the `Copy` button below `Token`.
6. Click on the `OAuth2` menu and choose `URL Generator` choose `bot` and `application.commands` option.
7. In the `Bot Permission` section and choose `Administrator`(If you want a more specific list of permission go to). Now you can click `Copy` at the very bottom to get the bot.invite link. **You must invite the bot to a server for future steps**.
8. Now download this repository, unzip the folder if it a zip file.
9. Make a `config.json` file, in there type the following: 
```json
{
    "clientId": "Your Client ID here",
    "token": "Your Bot Token here",
}
```
10. You can put the token that you copy and replace the text `Your Bot Token here`
11. Go into your discord client `Setting` > `Advance` and turn on `Developer Mode`
12. You can now copy the bot client ID by right clicking and select `Copy ID`. You can replace the text `Your Client ID here` in `config.json` with this ID. Save the file if you haven't already. 
13. Right click and choose `Open in Terminal` option or go to the path text box and type in `cmd`.
14. Run the command `npm setup` to install all the necessary package for the bot and setup the slash commands.
15. Finally run `npm start` to host the bot.

If you have any problem ask me on Discord my DM should be open. `mouthless_stoat`

## Bot Require Permission
- Read Messages/View Channels: The Bot needs to see messages to do look up
- Send Messages: The Bot needs to send message to reply
- Embed Links: The Bot needs embed for card display and other function
- Attach Files: The Bot needs to attach file or images for card portrait and [/guess-the-card](#guess-the-card-command)
- Read Messages History: The Bot needs to see old messages for [/retry](#retry-command) to work
- Use External Emoji: The Bot needs to use external emoji for cost and number emoji

## Query Syntax
You can search card based on the following:
- [MagpieTutor](#magpietutor)
  - [Table of Content](#table-of-content)
  - [How to host the bot yourself](#how-to-host-the-bot-yourself)
  - [Bot Require Permission](#bot-require-permission)
  - [Query Syntax](#query-syntax)
  - [Detail](#detail)
  - [Keywords](#keywords)
    - [Sigil](#sigil)
    - [Sigil Effect](#sigil-effect)
    - [Description](#description)
    - [Resource Cost](#resource-cost)
    - [Resource Type](#resource-type)
    - [Temple](#temple)
    - [Tribe](#tribe)
    - [Trait](#trait)
    - [Rarity](#rarity)
    - [Health](#health)
    - [Power](#power)
    - [Mox Color](#mox-color)
    - [Nicknames](#nicknames)
  - [Todo List](#todo-list)
  - [Plan for next update:](#plan-for-next-update)

## Detail
To use the filter search put a `q` modifier in front of everything. Ex:  `q[[h:>2 p:<4]]`  
To search for a specific information put the keyword follow by a `:` then the value you want (in quote if it have space. Ex: `s: "Touch of Death"`

## Keywords

### Sigil
**keyword**: `s` or `sigil`  
Filter to include a specific sigil.  
Ex:  
`q[[s:airborne]]`: Card with the Airborne  
`q[[s:"touch of death" s:sentry]]`: Card with `Touch of Death` and `Sentry`

### Sigil Effect
**keyword**: `e` or `effect`  
Filter to include a specific word or phase in sigil effect.  
Ex:  
`q[[e:"When a card bearing this sigil is played"]]`: Card with `on play` effect

### Description
**keyword**: `d` or `description`  
Filter to include a specific word or phase in description

### Resource Cost
**keyword**: `rc` or `resourcecost`  
Filter to include a certain converted resource cost (same as cmc). Cost is reduce to a number and this search for that (Mox is the amount of mox needed, a blue is 1, blue and green is 2, etc.). Can use `>`, `>=`, etc. to search.
Ex:  
`q[[rc:3]]`: Card with crc equal 3 (3 blood, 3 bone, etc.)  
`q[[rc:>4]]`: Card with crc more than 4.

### Resource Type
**keyword**: `rt` or `resourcetype`  
Filter to include a certain resource type.  
Possible type: All the card cost type (`blood`, `bone`, etc. `shattered` included)

### Temple
**keyword**: `t` or `temple`  
Filter to include a certain temple (augmented specific).  
Possible temple: all scrybe name (`beast`, `undead`, etc.) and a short version (all the starting character. `b`, `u`, etc.)

### Tribe
**keyword**: `tb` or `tribe`  
Filter to include a certain tribe.

### Trait
**keyword**: `tr` or `trait`  
Filter to include a certain trait.

### Rarity
**keyword**: `r` or `rarity`  
Filter for rarity/tier.  
Possible rarity: Possible value: base game rarity  (`common`, `rare`), custom rarity (`uncommon`, `talk`, `side` etc.) first character of rarity. (`c`, `u`, etc.)

### Health
**keyword**: `h` or `health`  
Filter to include a certain health. Can use `>`, `>=`, etc. to search.

### Power
**keyword**: `p` or `power`  
Filter to include a certain power. Can use `>`, `>=`, etc. to search.

### Mox Color
**keyword**: `c` or `color`  
Filter to include a specific mox color.  
Possible color: all full color name (`green`, `orange`, etc.), all full gem name (`emerald`, `ruby`, etc. `prism` included) and a short version (all the starting character. `g`, `o`, `e`, `r`, etc.)

### Nicknames
**keyword**: `is`  
There nickname for a few shortcut and special card type  
`vanilla` will give card with no sigils.  
`tank` will give card that have more than 5 health (card that can survive ebot).  
`square` will give card with power = health.  
`glass` will give card with more power than health (glass canon).  
`reflected` will give card with square and glass stat (for mirror removable).

## Todo List
- More advance stuff for query (negation, or, etc.)
- Deck submission that give a id to be recall
- Ruleset submission that give id to be recall
- Theme submission that give id to be recall
- Move all the bot documentation to the wiki section
- Better query doc with example

## Plan for next update:
TBA