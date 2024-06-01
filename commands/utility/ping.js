import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { Command } from '../Command.js'


class PingCommand extends Command {
    constructor() {
        super();
        this.category = 'Utility'
        this.data = new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!')
            .addBooleanOption(option =>
                option.setName('ephemeral')
                    .setDescription('Should the response be ephemeral?')
                    .setRequired(false)
            );
    }

    async execute(interaction) {
        const ping = interaction.client.ws.ping;
        const ephemeral = interaction.options.getBoolean('ephemeral');

        if (interaction.user.id === process.env.DEV_USER_ID) {
            const url = process.env.VIBIFY_API_URL;
            let status = 0;
            let statusText = 'Null';
                const res = await axios.get(url);
                status = res.status;
                statusText = res.statusText;

            const embed = new EmbedBuilder()
                .setTitle('Pong!')
                .setDescription("`Dev Mode`")
                .addFields(
                    { name: 'API Latency', value: `${interaction.client.ws.ping}ms`, inline: true },
                    { name: 'Slash Command Latency', value: `${ping}ms`, inline: true },
                    { name: 'Vibify', value: `${status} ${statusText}`, inline: false },
                )
                .setColor('#00ff00')
                .setTimestamp()
                .setThumbnail(interaction.client.user.avatarURL() ? interaction.client.user.avatarURL() : interaction.client.user.defaultAvatarURL)
                .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

            await interaction.reply({ embeds: [embed], ephemeral: ephemeral });
            return;
        }
        await interaction.reply({ content: 'Pong! ' + ping + 'ms', ephemeral: ephemeral });
    }
}

export default new PingCommand();