const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ActionRow, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../botconfig/embed.json');
const SpotifySession = require('../../Api/Spotify/Spotify');
const {setTimeout: wait} = require("node:timers/promises");
const apiUrl = process.env.SPOTIFY_API_URL;
const secureToken = process.env.SPOTIFY_SECURE_TOKEN;

const currentYear = new Date().getFullYear();
const choices = [];
for (let year = 2015; year <= currentYear; year++) {
    choices.push({ name: year.toString(), value: year.toString() });
}


const monthChoices = [];

for (let i = 1; i <= 12; i++) {
    const month = i.toString().padStart(2, '0'); // Pad single-digit months with leading zero
    const monthName = new Date(currentYear, i - 1, 1).toLocaleString('en-US', { month: 'long' });

    // Add the month choice to the array
    monthChoices.push({ name: monthName, value: month });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Create a playlist of your liked songs from a specific month.')
        .addStringOption(option =>
            option.setName('month')
                .setDescription('The month to create the playlist for.')
                .setRequired(true)
                .addChoices(
                    ...monthChoices,
                ),
        )
        .addStringOption(option =>
            option.setName('year')
                .setDescription('The year to create the playlist for.')
                .setRequired(true)
                .addChoices(
                    ...choices,
                ),
        )
        .addBooleanOption( option =>
            option.setName('ephemeral')
                .setDescription('Should the response be ephemeral?')
                .setRequired(false)
        ),

    async execute(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const spotifySession = new SpotifySession(secureToken, apiUrl, process.env.SPOTIFY_REDIRECT_URI, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
        const user = await spotifySession.getUser(interaction.user.id);

        if (!user) {
            throw new Error('You are not logged in to Spotify. Please login using `/spotify login`.');
        }
        await interaction.deferReply({ ephemeral: true });

        const month = interaction.options.getString('month');
        const year = interaction.options.getString('year');

        const playlistName = `Liked Songs from ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year}.`;

        const playlist = await spotifySession.createPlaylist(interaction.user.id, playlistName, month, year);
        if (!playlist) {
            throw new Error('Something went wrong while creating your playlist. Please try again later.');
        }
        const name = playlist.name;
        const total = playlist.tracks.total.toString();

        //send a message to the user to let them know we're working on it
        const embed = new EmbedBuilder()
            .setColor(config.color_success)
            .setTitle('Done ✅')
            .setDescription(`Click the button below to view your playlist on Spotify.`)
            .addFields(
                { name: 'Name', value: name, inline: true },
                { name: 'Total Tracks', value: total, inline: true },
            )
            .setURL(playlist.external_urls.spotify)
            .setTimestamp()
            .setThumbnail(playlist.images[0].url);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View Playlist')
                    .setStyle(ButtonStyle.Link)
                    .setURL(playlist.external_urls.spotify),
            );

        if (!ephemeral) {
            await interaction.editReply({content: 'Done ✅', ephemeral: true});
            await interaction.followUp({ embeds: [embed], components: [row]});
            await interaction.deleteReply();
        } else {
            await interaction.editReply({ embeds: [embed], components: [row], ephemeral: true });
        }
    }

};