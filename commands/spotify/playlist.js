const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ActionRow, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../botconfig/embed.json');
const SpotifySession = require('../../Api/Spotify/SessionHandler');
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
        await interaction.deferReply({ ephemeral: true });

        const spotifySession = new SpotifySession(
            secureToken,
            apiUrl,
            process.env.SPOTIFY_REDIRECT_URI,
            process.env.SPOTIFY_CLIENT_ID,
            process.env.SPOTIFY_CLIENT_SECRET
        );
        const user = await spotifySession.getUser(interaction.user.id);
        await wait(4000);

        const month = interaction.options.getString('month');
        const year = interaction.options.getString('year');

        const playlistName = `Liked Songs from ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year}.`;

        //send a message to the user to let them know we're working on it
        const embed = new EmbedBuilder()
            .setColor(config.color_success)
            .setTitle('Creating Playlist: ' + playlistName)
            .setDescription(`Creating a playlist for ${month}/${year}...`)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }

};