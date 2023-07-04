const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../botconfig/embed.json');
const SpotifySession = require('../../Api/Spotify/Spotify');
const { setTimeout: wait } = require("node:timers/promises");
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

const queue = [];
let isProcessing = false;

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
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('Should the response be ephemeral?')
                .setRequired(false)
        ),

    async execute(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const spotifySession = new SpotifySession(secureToken, apiUrl, process.env.SPOTIFY_REDIRECT_URI, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
        const user = await spotifySession.getUser(interaction.user.id);

        if (!user) {
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Something went wrong while getting your user information.')
                .addFields(
                    { name: '`Solution`', value: 'Please use the `/spotify login` command to authorize the bot.' },
                    { name: '`Note`', value: 'If you have already authorized the bot, please wait a few minutes and try again.' }
                )
                .setTimestamp();
            await interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }


        const month = interaction.options.getString('month');
        const year = interaction.options.getString('year');

        const playlistName = `Liked Songs from ${new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })} ${year}.`;
        queue.push({
            interaction,
            ephemeral,
            spotifySession,
            user,
            month,
            year,
            playlistName
        });

        const embed = new EmbedBuilder()
            .setColor(config.color_info)
            .setTitle('Creating Playlist')
            .setDescription('Please wait while the playlist is being created.')
            .addFields(
                { name: 'Month', value: month, inline: true },
                { name: 'Year', value: year, inline: true },
                { name: 'Playlist Name', value: playlistName, inline: true },
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed], ephemeral });


        // Process the queue if it's not already being processed
        if (!isProcessing) {
            await processQueue();
        }
    }
};

async function processQueue() {
    isProcessing = true;

    // Process requests one by one from the queue
    while (queue.length > 0) {
        const { interaction, ephemeral, spotifySession, user, month, year, playlistName } = queue.shift();
        try {
            const playlist = await spotifySession.createPlaylist(playlistName, month, year);

            if (playlist) {
                const embed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Playlist Created')
                    .setDescription(`Click the button below to view the playlist.`)
                    .setURL(playlist.external_urls.spotify)
                    .addFields({ name: 'Name', value: playlist.name, inline: true },
                        { name: 'Total Tracks', value: playlist.tracks.total.toString(), inline: true },
                        { name: 'Owner', value: playlist.owner.display_name, inline: true
                    })
                    .setThumbnail(playlist.images[0].url)
                    .setTimestamp()
                    .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });

                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setLabel('View Playlist')
                            .setStyle(ButtonStyle.Link)
                            .setURL(playlist.external_urls.spotify),
                    );

                await interaction.editReply({ embeds: [embed], components: [row], ephemeral });
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Songs Found')
                    .setDescription('No songs found for the specified month.')
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed], ephemeral });
            }
        } catch (error) {
            console.log(error);
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Failed to create the playlist.')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], ephemeral });
        }

        await wait(2000);
    }

    isProcessing = false;
}
