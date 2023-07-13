const { REST, Routes } = require('discord.js');
const Dotenv = require('dotenv');
Dotenv.config();
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const guildCommands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            if (command.guildOnly) {
                command.data.guildOnly = command.guildOnly;
                guildCommands.push(command.data.toJSON());
            }
            else {
                commands.push(command.data.toJSON());
            }
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const rest = new REST().setToken(token);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);
        // refresh all the global commands
        await rest.put(
            Routes.applicationCommands(clientId),
            {body: commands},
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

(async () => {
    try {
        console.log(`Started refreshing ${guildCommands.length} guild (/) commands.`);
        for (const guildCommand of guildCommands) {
            for (const guildId of guildCommand.guildOnly) {
                console.log(`Refreshing guild command ${guildCommand.name} for guild ${guildId}`);
                // refresh all the guild commands
                await rest.put(
                    Routes.applicationGuildCommands(clientId, guildId),
                    {body: [guildCommand]},
                );
            }
        }
        console.log('Successfully reloaded guild (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();