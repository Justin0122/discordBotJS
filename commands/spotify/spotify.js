const { SlashCommandBuilder } = require('discord.js');
const fs = require("fs");

const currentYear = new Date().getFullYear();
const choices = [];
for (let year = 2015; year <= currentYear; year++) {
    choices.push({ name: year.toString(), value: year.toString() });
}

const monthChoices = [];
for (let i = 1; i <= 12; i++) {
    const month = i.toString().padStart(2, '0');
    const monthName = new Date(currentYear, i - 1, 1).toLocaleString('en-US', { month: 'long' });

    monthChoices.push({ name: monthName, value: month });
}

const subCommandFiles = fs.readdirSync(`${__dirname}/subCommands/User/`).filter(file => file.endsWith('.js'));
const subCommandsUser = subCommandFiles.map(file => file.slice(0, -3).charAt(0).toUpperCase() + file.slice(1, -3));
console.log(subCommandsUser);

const subCommandFiles2 = fs.readdirSync(`${__dirname}/subCommands/Playlist/`).filter(file => file.endsWith('.js'));
const subCommandsPlaylist = subCommandFiles2.map(file => file.slice(0, -3).charAt(0).toUpperCase() + file.slice(1, -3));
console.log(subCommandsPlaylist);



module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('spotify')
        .setDescription('Allow the bot to access your spotify account.')
        .addSubcommandGroup(group =>
            group
                .setName('user')
                .setDescription('User commands.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('authorize')
                        .setDescription('Authorize the bot to access your spotify account.'),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('me')
                        .setDescription('Get information about your spotify account.')
                        .addBooleanOption(option =>
                            option
                                .setName('ephemeral')
                                .setDescription('Whether or not the message should be ephemeral.')
                                .setRequired(false),
                        ),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('logout')
                        .setDescription('Logout of your spotify account.'),
                ),
        )
        .addSubcommandGroup(group =>
            group
                .setName('playlist')
                .setDescription('Playlist commands.')
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('liked')
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
                        )
                        .addBooleanOption(option =>
                            option.setName('notify')
                                .setDescription('Should the bot notify you when the playlist is created?')
                                .setRequired(false)
                        ),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('recommendations')
                        .setDescription('Create a playlist with song recommendations based on your liked/most played songs.')
                        .addBooleanOption(option =>
                            option.setName('ephemeral')
                                .setDescription('Should the response be ephemeral?')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option.setName('notify')
                                .setDescription('Should the bot notify you when the playlist is created?')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('mood')
                                .setDescription('What mood should the playlist have?')
                                .setRequired(false)
                                .setAutocomplete(true)
                        ),
                ),
        ),

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const choices = ['Happy', 'Sad', 'Angry', 'Chill', 'Party', 'Romantic', 'Workout', 'Focus', 'Sleep', 'Study', 'Travel', 'Rainy Day', 'Energetic', 'Relaxed', 'Motivated', 'Melancholic', 'Excited', 'Reflective', 'Nostalgic', 'Calm', 'Bored', 'Lonely', 'Stressed', 'Anxious', 'Tired', 'Sick', 'Heartbroken', 'In Love', 'Confident', 'Pumped', 'Trippy'];
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));
        const sliced = focusedValue ? filtered.slice(0, 25) : filtered.sort(() => Math.random() - 0.5).slice(0, 25);
        await interaction.respond(
            sliced.map(choice => ({ name: choice, value: choice })),
        );
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand().charAt(0).toUpperCase() + interaction.options.getSubcommand().slice(1);
        const subcommandGroup = interaction.options.getSubcommandGroup().charAt(0).toUpperCase() + interaction.options.getSubcommandGroup().slice(1);
        const subCommandDir = `${__dirname}/subCommands/${subcommandGroup}`;

        const commandPath = `${subCommandDir}/${subcommand}`;
        const command = require(commandPath);

        const SpotifySession = require('../../Api/Spotify/Spotify');
        const spotifySession = new SpotifySession(process.env.SPOTIFY_SECURE_TOKEN, process.env.SPOTIFY_API_URL, process.env.SPOTIFY_REDIRECT_URI, process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);

        return command.execute(interaction, spotifySession);
    },
};