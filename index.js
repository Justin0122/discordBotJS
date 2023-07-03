const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const config = require('./botconfig/embed.json');
const Dotenv = require('dotenv');
Dotenv.config();
const token = process.env.TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.cooldowns = new Collection();
client.commands = new Collection();

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

client.once(Events.ClientReady, async () => {
    console.log('Ready!');
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    const { cooldowns } = client;

    if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.data.name);
    const defaultCooldownDuration = 2;
    const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

        if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000);
            return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
        }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

    try {
        const embed = await command.execute(interaction);
        if (interaction.replied) {
            return;
        }
        embed.setColor(config.color_success);
        embed.setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });
        embed.setTimestamp();

        const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
        if (ephemeral) {
            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
        else {
            await interaction.reply({ embeds: [embed] });
        }
    } catch (error) {
        const embed = new EmbedBuilder()
            .setColor(config.color_error)
            .setTitle('Error')
            .addFields(
                { name: 'Command', value: `\`${command.data.name}\`` },
                { name: 'Error', value: error.message },
            )
            .setTimestamp();
        try{
            await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.log(error);
        }
    }
});

client.login(token);