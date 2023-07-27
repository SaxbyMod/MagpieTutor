# MagpieTutor
<a href="https://discord.com/api/oauth2/authorize?client_id=1066417513115697275&permissions=137439333440&scope=applications.commands%20bot">
        <img src="https://img.shields.io/badge/Invite_the_Bot-blue"
            alt="Invite the Bot">
</a>

Scryfall bot but for Inscryption. Currently the bot can look up card in the following format/set:
- IMF Competitive
- IMF Eternal
- IMF Vanilla
- Augmented
- Inscryption Redux

IF you have any request for new set send me a message on discord. `mouthless_stoat`.

## Table of Content
- [MagpieTutor](#magpietutor)
  - [Table of Content](#table-of-content)
  - [How to host the bot yourself](#how-to-host-the-bot-yourself)
  - [Bot Require Permission](#bot-require-permission)
  - [Commands](#commands)
    - [Draft Command](#draft-command)
      - [Argument](#argument)
    - [Set Code Command](#set-code-command)
    - [Deck Sim Command](#deck-sim-command)
    - [Tunnel Status Command](#tunnel-status-command)
    - [Color Text Command](#color-text-command)
    - [Guess the Card Command](#guess-the-card-command)
      - [Normal](#normal)
      - [Scramble](#scramble)
    - [Retry Command](#retry-command)
  - [Modifier](#modifier)
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

## Commands

### Draft Command
Draft a deck from opening Pack

#### Argument
- `set`: Which set you want to draft from (You cannot choose multiple set)
- `size`: The final deck side or how many pack you want to open
- Option for excluding certain cost. Free card will still appear:
    - `beast`: Remove all cards that cost blood from the draft pool
    - `undead`: Remove all cards that cost blood from the draft pool
    - `tech`: Remove all cards that cost blood from the draft pool
    - `magick`: Remove all cards that cost blood from the draft pool. This will also remove all the cards that support magick

<!-- omit from toc -->
#### Note
- You cannot undo selection. 
- Once you have 4 of the same common and try to take a fifth you will receive a Wild instead 
- Wild can be use to trade in any common card
- Once you exhaust the list of rare in the draft pool you will not get any more rare

### Set Code Command
Show the set code that you can use to search

Current set code:
- comp: competitive
- e: eternal
- v: vanilla
- g: mr.egg
- a: augmented
- r: redux
- m: magic the gathering
  
- o: original version (Modifier)
- c: compact (Modifier)
- p: no portrait (Modifier)
- s: sigil (Modifier)
- `: no search (Modifier)
- q: query (Modifier)

info for modifier can be view [here](#modifier)
### Deck Sim Command
Simulate deck draw for whatever reason

<!-- omit from toc -->
#### Argument
- `deck-file`: The deck file you want to simulate
- `deck-list`: The deck list you want to simulate. Card separate by commas (",")
- `detail`: Show more detail about the deck like card draw percentage, which card are left, etc

<!-- omit from toc -->
#### Note
- Select `End` if you stop using it

### Tunnel Status Command
Current Status of tunnel

<!-- omit from toc -->
#### Note
The tunnel is check by sending a request to the [website](http://localtunnel.me). It may not be accurate because my laptop may not reach the website [check it yourself just to be sure](https://isitdownorjust.me/localtunnel-me/).

### Color Text Command
Generate a color text thing for discord

<!-- omit from toc -->
#### Color Tag
- \$$g: Make the text after this tag gray
- \$$r: Make the text after this tag red
- \$$e: Make the text after this tag green
- \$$y: Make the text after this tag yellow
- \$$b: Make the text after this tag blue
- \$$p: Make the text after this tag pink
- \$$c: Make the text after this tag cyan
- \$$w: Make the text after this tag white

- \$$1: Make the background of the text after this tag Firefly Dark Blue
- \$$2: Make the background of the text after this tag Orange
- \$$3: Make the background of the text after this tag Marble Blue
- \$$4: Make the background of the text after this tag Greyish Turquoise
- \$$5: Make the background of the text after this tag Gray
- \$$6: Make the background of the text after this tag Indigo
- \$$7: Make the background of the text after this tag Light Gray
- \$$8: Make the background of the text after this tag White

- \$$l: Bold the text after this tag
- \$$u: Underline the text after this tag

- \$$0: Reset everything
- 
<!-- omit from toc -->
#### Note
If you want to see what the color look like or how this command work in the background check out this [guide](https://gist.github.com/kkrypt0nn/a02506f3712ff2d1c8ca7c9e0aed7c06)

### Guess the Card Command

#### Normal
Send part of a card and you can guess it

<!-- omit from toc -->
##### Argument
- `set`: The set where magpie pull the card from
- `difficulty`: Optional if you already choose `size`. The size of each difficulty is as follow:
  - `Easy`: 20x20
  - `Normal`: 15x15
  - `Hard`: 10x10
  - `VERY FUCKING HARD`: 5x5
- `size`: Optional if you already choose `difficulty`. The size of the crop region.

<!-- omit from toc -->
##### Note
If both `difficulty` and `size` are selected `difficulty` will overwrite the `size`.

#### Scramble
Send the card scramble

<!-- omit from toc -->
##### Argument
- `set`: The set where magpie pull the card from
- `difficulty`: Optional if you already choose `size`. The size of each difficulty is as follow:
  - `Easy`: 20 pieces (3 cols and 2 rows)
  - `Normal`: 15 pieces (5 cols and 3 rows)
  - `Hard`: 35 pieces (7 cols and 5 rows)
  - `Very Hard`: 63 pieces (9 cols and 7 rows)
  - `IMPOSSIBLE`: 1148 pieces (scamble every pixle)
- `size`: Optional if you already choose `difficulty`. The cols and rows you want. Cols go first then rows follow with a comma in between

<!-- omit from toc -->
##### Note
If both `difficulty` and `size` are selected `difficulty` will overwrite the `size`.

Example on size: `6,5` will have 6 cols and 3 rows

### Retry Command
Magpie will look at a message again in case you edit or mess up.

<!-- omit from toc -->
#### Argument
- `id`: Id of the message can access by using Developer mode and click `Copy ID` on message.

## Modifier
Modifier is special code you can add in front of set code to modify the output. Here are the current modifier

o: Some card are modified this will change it to the un-alter version.
c: Remove sigil description among other thing to save space.
p: Renove the portrait attachment, will make searching way faster (90-99% latency reduction)
s: Search for sigils instead of card
`: Skip this search
q: Search for cards using Scryfall like syntax. More info [here](#query-syntax)

## Query Syntax
You can search card based on the following:
- [Sigil](#sigil)
- [Sigil Effect](#sigil-effect)
- [Description / flavor text](#description)
- [Resource Cost](#resource-cost)
- [Resource Type](#resource-type)
- [Temple](#temple)
- [Tribe](#tribe)
- [Trait](#trait)
- [Rarity](#rarity)
- [Health](#health)
- [Power](#power)
- [Mox Color](#mox-color)
- [Nickname](#nicknames)

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
- ~~Support for Augmented Look up~~
- Support for Augmented Draft
- ~~Support for Augmented Guess the Card~~
- ~~New Guess the Card submit using model instead of messages (Less bug?)~~
- ~~Fix Augmented no art bug~~
- ~~Search with scryfall like syntax~~
- ~~Augmented specific syntax~~
- ~~Rewrote pool to make fetch a bit faster~~
- Make draft work to work with new pool
- More advance stuff for query (negation, or)
- Deck submission that give a id to be recall
- Ruleset submission that give id to be recall
- Theme submission that give id to be recall
- Move all the bot documentation to the wiki section
- ~~Query info command~~
- Better query doc with example