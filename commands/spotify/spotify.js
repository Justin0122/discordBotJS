const { SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {createPaginatedEmbed} = require("../../Utils/Pagination");
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

module.exports = {
    category: 'Spotify',
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('spotify')
        .setDescription('Spotify commands.')
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

    async help(interaction){
        const embeds = [];
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;

        const firstPage = new EmbedBuilder()
            .setTitle("Spotify Help Menu")
            .setDescription("This is the help menu for the Spotify commands.")
            .addFields(
                {name: "User Commands", value: "Use these commands to authorize the bot, show your profile information or deauthorize the bot.", inline: false},
                { name: "Playlist Commands", value: "These commands are used to create playlists.", inline: false },
                { name: " ", value: "Go to the next page to see the commands.", inline: false },
            )
        embeds.push(firstPage);

        const secondPage = new EmbedBuilder()
            .setTitle("User Commands")
            .setDescription("Use these commands to authorize the bot, show your profile information or deauthorize the bot.")
            .addFields(
                {name: "Authorize", value: "Authorize the bot to access your spotify account.", inline: false},
                { name: "Me", value: "Get information about your spotify account.", inline: false },
                { name: "Logout", value: "Deauthorize the bot.", inline: false },
            )
        embeds.push(secondPage);

        const thirdPage = new EmbedBuilder()
            .setTitle("Playlist Commands")
            .setDescription("These commands are used to create playlists.")
            .addFields(
                {name: "Liked", value: "Create a playlist of your liked songs from a specific month.", inline: false},
                { name: "Recommendations", value: "Create a playlist with song recommendations based on your liked/most played songs.", inline: false },
            )
        embeds.push(thirdPage);

        await createPaginatedEmbed(interaction, embeds, 1, false, '', ephemeral);
    }
};