import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import {createPaginatedEmbed} from "../../Utils/Pagination.js";

export default {
    category: 'Info',
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Provides information about the server.'),
    async execute(interaction) {
        // interaction.guild is the object representing the Guild in which the command was run
        await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
    },

    async help(interaction) {
        const embeds = [];
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;

        const firstPage = new EmbedBuilder()
            .setTitle('Info')
            .setDescription('`/server` - Provides information about the server.\n' +
                '`/user` - Provides information about the user.'
            );

        embeds.push(firstPage);

        await createPaginatedEmbed(interaction, embeds, 1, false, '', ephemeral);
    },
};