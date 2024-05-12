import fs from 'fs';
import path from 'path';
import {Client, Collection, GatewayIntentBits, Events} from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const token = process.env.TOKEN;

const client = new Client({
        intents:
            [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
            ]
    }
);
client.cooldowns = new Collection();
client.commands = new Collection();

client.commands = new Collection();
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const commandModule = await import(filePath);
        const command = commandModule.default;
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const eventModule = await import(filePath);
    const event = eventModule.default;
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}
// require('./events/messageCreate.js')(client);

client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {

    } else if (interaction.isAutocomplete()) {
        const command = interaction.client.commands.get(interaction.commandName);

        try {
            await command.autocomplete(interaction);
        } catch (error) {
            console.log(error);
        }
    }
});

client.login(token);