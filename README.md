# Discord bot JS



## Introduction



Discord bot written in JS using:

* Official [Discord.js](https://discord.js.org/#/) library
* [Node.js](https://nodejs.org/en/)
* Guide: [Discord.js Guide](https://discordjs.guide/)


## Installation
> **Note:** This bot requires Node v16.9.0 or higher.

```bash
git clone
cd discord-bot-js
npm install
```

## Configuration
> **Note:** You need to create a bot on the [Discord Developer Portal](https://discord.com/developers/applications) and add it to your server. The bot requires: `Send Messages`, `Manage Messages`, `Embed Links`, `Attach Files`, `Read Message History`, `Use External Emojis`, `Add Reactions` permissions.
> 
>Don't forget to enable `Message Content Intent` in the `Bot` section of your application.

> Rename .env.example to .env and fill in the required fields.

## Usage

### Starting the bot

```bash
node index.js
```

### Deploying commands
    
```bash
node deployCommands.js
```

## Features
- [x] slash commands


## Notes
- This bot is currently under development and may contain bugs.


