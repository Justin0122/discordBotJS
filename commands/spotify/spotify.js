const {SlashCommandBuilder, EmbedBuilder} = require('discord.js');
const {createPaginatedEmbed} = require("../../Utils/Pagination");
const Vibify = require('@vibify/vibify');
const currentYear = new Date().getFullYear();
const choices = [];
for (let year = currentYear; year >= 2015; year--) {
    choices.push({name: year.toString(), value: year.toString()});
}

const monthChoices = [];
for (let i = 1; i <= 12; i++) {
    const month = i.toString().padStart(2, '0');
    const monthName = new Date(currentYear, i - 1, 1).toLocaleString('en-US', {month: 'long'});

    monthChoices.push({name: monthName, value: month});
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
                        .setName('other')
                        .setDescription('Get information about another user\'s spotify account.')
                        .addUserOption(option =>
                            option
                                .setName('user')
                                .setDescription('The user to get information about.')
                                .setRequired(true),
                        )
                        .addBooleanOption(option =>
                            option
                                .setName('ephemeral')
                                .setDescription('Whether or not the message should be ephemeral.')
                                .setRequired(false),
                        ),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('last-listened')
                        .setDescription('Get the last listened tracks.')
                        .addBooleanOption(option =>
                            option
                                .setName('ephemeral')
                                .setDescription('Whether or not the message should be ephemeral.')
                                .setRequired(false),
                        ),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('top-tracks')
                        .setDescription('Get the user\'s top tracks.')
                        .addBooleanOption(option =>
                            option
                                .setName('ephemeral')
                                .setDescription('Whether or not the message should be ephemeral.')
                                .setRequired(false),
                        ),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('top-artists')
                        .setDescription('Get the user\'s top artists.')
                        .addBooleanOption(option =>
                            option
                                .setName('ephemeral')
                                .setDescription('Whether or not the message should be ephemeral.')
                                .setRequired(false),
                        ),
                )
                .addSubcommand(subcommand =>
                    subcommand
                        .setName('last-liked')
                        .setDescription('Get the last liked songs.')
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
                            option.setName('genre')
                                .setDescription('What genres should the playlist have? (Separate with commas)')
                                .setRequired(false)
                                .setAutocomplete(true)
                        )
                        .addBooleanOption(option =>
                            option.setName('most-played')
                                .setDescription('Should the generator use your most played songs? default: true')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option.setName('liked-songs')
                                .setDescription('Should the generator use your liked songs? default: true')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option.setName('recently-played')
                                .setDescription('Should the generator use your recently played songs? default: false')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option.setName('currently-playing')
                                .setDescription('Should the generator use your currently playing song? default: false')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option.setName('audio-features')
                                .setDescription('Should the generator use audio features? May interfere with genre. default: true')
                                .setRequired(false)
                        )
                        .addBooleanOption(option =>
                            option.setName('seed-tracks')
                                .setDescription('Should the generator use track seeds? default: false (if false, will use audio features only)')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-acousticness')
                                .setDescription('0 to 1')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-danceability')
                                .setDescription('0 to 1')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-energy')
                                .setDescription('0 to 1')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-instrumentalness')
                                .setDescription('0 to 1')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-liveness')
                                .setDescription('0 to 1')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-speechiness')
                                .setDescription('0 to 1')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-loudness')
                                .setDescription('-60 to 0 (dB)')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-tempo')
                                .setDescription('0 to 200 (BPM)')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-valence')
                                .setDescription('0 = negative, 1 = positive')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-popularity')
                                .setDescription('0 to 100')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-key')
                                .setDescription('0 = C, 1 = C♯/D♭, 2 = D, and so on. (0 to 11)')
                                .setRequired(false)
                        )
                        .addStringOption(option =>
                            option.setName('target-mode')
                                .setDescription('0 = minor, 1 = major')
                                .setRequired(false)
                        ),
                ),
        ),

async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    if (interaction.options.getFocused(true).name === 'genre') {
        const genres = require('../../Utils/genres.json');
        const enteredGenres = focusedValue.split(',').map(genre => genre.trim());
        const lastEnteredGenre = enteredGenres[enteredGenres.length - 1];
        const filteredGenres = genres.genres.filter(genre => genre.toLowerCase().startsWith(lastEnteredGenre.toLowerCase())).slice(0, 25);
        const previousGenres = enteredGenres.slice(0, -1).join(', ');
        const sliced = filteredGenres.map(genre => ({
            name: `${previousGenres ? previousGenres + ', ' : ''}${genre}`,
            value: `${previousGenres ? previousGenres + ', ' : ''}${genre}`
        }));
        await interaction.respond(sliced);
    }
},

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand().charAt(0).toUpperCase() + interaction.options.getSubcommand().slice(1);
        const subcommandGroup = interaction.options.getSubcommandGroup().charAt(0).toUpperCase() + interaction.options.getSubcommandGroup().slice(1);
        const subCommandDir = `${__dirname}/subCommands/${subcommandGroup}`;

        const commandPath = `${subCommandDir}/${subcommand}`;
        const command = require(commandPath);

        const spotifySession = new Vibify();

        return command.execute(interaction, spotifySession);
    }
    ,

    async help(interaction) {
        const embeds = [];
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;

        const firstPage = new EmbedBuilder()
            .setTitle("Spotify Help Menu")
            .setDescription("This is the help menu for the Spotify commands.")
            .addFields(
                {
                    name: "User Commands",
                    value: "Use these commands to authorize the bot, show your profile information or deauthorize the bot.",
                    inline: false
                },
                {name: "Playlist Commands", value: "These commands are used to create playlists.", inline: false},
                {name: " ", value: "Go to the next page to see the commands.", inline: false},
            )
        embeds.push(firstPage);

        const secondPage = new EmbedBuilder()
            .setTitle("User Commands")
            .setDescription("Use these commands to authorize the bot, show your profile information or deauthorize the bot.")
            .addFields(
                {name: "Authorize", value: "Authorize the bot to access your spotify account.", inline: false},
                {name: "Me", value: "Get information about your spotify account.", inline: false},
                {name: "Logout", value: "Deauthorize the bot.", inline: false},
            )
        embeds.push(secondPage);

        const thirdPage = new EmbedBuilder()
            .setTitle("Playlist Commands")
            .setDescription("These commands are used to create playlists.")
            .addFields(
                {name: "Liked", value: "Create a playlist of your liked songs from a specific month.", inline: false},
                {
                    name: "Recommendations",
                    value: "Create a playlist with song recommendations based on your liked/most played songs.",
                    inline: false
                },
            )
        embeds.push(thirdPage);

        await createPaginatedEmbed(interaction, embeds, 1, false, '', ephemeral);
    }
}
;