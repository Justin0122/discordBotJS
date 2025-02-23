import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'
import config from '../../../../botconfig/embed.json' with {type: "json"}
import { Command } from '../../../Command.js'
import dotenv from "dotenv";
dotenv.config();

class SpotifyAuthorize extends Command {
    constructor() {
        super();
        this.category = 'Spotify'
    }

    async execute(interaction) {
        const {SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI} = process.env;
        const state = interaction.user.id;
        const scopes = [
            'user-read-email', 'user-read-private', 'user-library-read', 'user-top-read',
            'user-read-recently-played', 'user-read-currently-playing', 'user-follow-read',
            'playlist-read-private', 'playlist-modify-public', 'playlist-modify-private',
            'playlist-read-collaborative', 'user-library-modify'
        ].join('%20');

        const url = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${SPOTIFY_REDIRECT_URI}&scope=${scopes}&state=${state}`;

        const embed = new EmbedBuilder()
            .setTitle('Spotify Login')
            .setDescription('Click the button below to authorize the bot to access your Spotify account.')
            .setColor(config.success)
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Authorize')
                    .setURL(url)
                    .setStyle(ButtonStyle.Link),
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    }
}

export default SpotifyAuthorize;