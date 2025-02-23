import {SlashCommandBuilder, EmbedBuilder} from 'discord.js';
import {createPaginatedEmbed} from '../../Utils/Embed/Pagination.js';
import Vibify from '@vibify/vibify';
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import {Command} from '../Command.js';
import dotenv from 'dotenv';

dotenv.config();

const currentYear = new Date().getFullYear();
const choices = Array.from({length: currentYear - 2014}, (_, i) => {
    const year = currentYear - i;
    return {name: year.toString(), value: year.toString()};
});

const filters = [{name: 'Artist', value: 'artist'}];

const monthChoices = Array.from({length: 12}, (_, i) => {
    const month = (i + 1).toString().padStart(2, '0');
    const monthName = new Date(currentYear, i, 1).toLocaleString('en-US', {month: 'long'});
    return {name: monthName, value: month};
});

class SpotifyCommand extends Command {
    constructor() {
        super();
        this.category = 'Spotify';
        this.cooldown = 30;
        this.data = new SlashCommandBuilder()
            .setName('spotify')
            .setDescription('Spotify commands.')
            .addSubcommandGroup(group =>
                group.setName('user').setDescription('User commands.')
                    .addSubcommand(sub => sub.setName('authorize').setDescription('Authorize the bot to access your spotify account.'))
                    .addSubcommand(sub => sub.setName('me').setDescription('Get information about your spotify account.')
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Whether or not the message should be ephemeral.')))
                    .addSubcommand(sub => sub.setName('other').setDescription('Get information about another user\'s spotify account.')
                        .addUserOption(opt => opt.setName('user').setDescription('The user to get information about.').setRequired(true))
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Whether or not the message should be ephemeral.')))
                    .addSubcommand(sub => sub.setName('last-listened').setDescription('Get the last listened tracks.')
                        .addUserOption(opt => opt.setName('user').setDescription('The user to get the last listened tracks from.'))
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Whether or not the message should be ephemeral.')))
                    .addSubcommand(sub => sub.setName('top-tracks').setDescription('Get the user\'s top tracks.')
                        .addUserOption(opt => opt.setName('user').setDescription('The user to get the top listened tracks from.'))
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Whether or not the message should be ephemeral.')))
                    .addSubcommand(sub => sub.setName('top-artists').setDescription('Get the user\'s top artists.')
                        .addUserOption(opt => opt.setName('user').setDescription('The user to get the top artists from.'))
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Whether or not the message should be ephemeral.')))
                    .addSubcommand(sub => sub.setName('last-liked').setDescription('Get the last liked songs.')
                        .addUserOption(opt => opt.setName('user').setDescription('The user to get the last liked tracks from.'))
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Whether or not the message should be ephemeral.')))
                    .addSubcommand(sub => sub.setName('logout').setDescription('Logout of your spotify account.')))
            .addSubcommandGroup(group =>
                group.setName('playlist').setDescription('Playlist commands.')
                    .addSubcommand(sub => sub.setName('liked').setDescription('Create a playlist of your liked songs from a specific month.')
                        .addStringOption(opt => opt.setName('month').setDescription('The month to create the playlist for.').setRequired(true).addChoices(...monthChoices))
                        .addStringOption(opt => opt.setName('year').setDescription('The year to create the playlist for.').setRequired(true).addChoices(...choices))
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Should the response be ephemeral?'))
                        .addBooleanOption(opt => opt.setName('notify').setDescription('Should the bot notify you when the playlist is created?')))
                    .addSubcommand(sub => sub.setName('filter-liked').setDescription('Create a playlist of your liked songs based on a filter.')
                        .addStringOption(opt => opt.setName('filter').setDescription('The filter to use.').setRequired(true).addChoices(...filters))
                        .addStringOption(opt => opt.setName('value').setDescription('The value to use for the filter.').setRequired(true))
                        .addBooleanOption(opt => opt.setName('ephemeral').setDescription('Should the response be ephemeral?'))
                        .addBooleanOption(opt => opt.setName('notify').setDescription('Should the bot notify you when the playlist is created?'))))
    }

    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        if (interaction.options.getFocused(true).name === 'genre') {
            const genresModule = await import('../../Utils/genres.json', {with: {type: 'json'}});
            const genres = genresModule.default;
            const enteredGenres = focusedValue.split(',').map(genre => genre.trim());
            const lastEnteredGenre = enteredGenres.pop();
            const filteredGenres = genres.genres.filter(genre => genre.toLowerCase().startsWith(lastEnteredGenre.toLowerCase())).slice(0, 25);
            const previousGenres = enteredGenres.join(', ');
            const sliced = filteredGenres.map(genre => ({
                name: `${previousGenres ? previousGenres + ', ' : ''}${genre}`,
                value: `${previousGenres ? previousGenres + ', ' : ''}${genre}`
            }));
            await interaction.respond(sliced);
        }
    }

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand().charAt(0).toUpperCase() + interaction.options.getSubcommand().slice(1);
        const subcommandGroup = interaction.options.getSubcommandGroup().charAt(0).toUpperCase() + interaction.options.getSubcommandGroup().slice(1);

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);

        const commandPath = join(__dirname, 'subCommands', subcommandGroup, `${subcommand}.js`);
        const {default: CommandClass} = await import(commandPath);

        const command = new CommandClass();
        const spotifySession = new Vibify(process.env.VIBIFY_API_URL, process.env.APPLICATION_ID);

        return command.execute(interaction, spotifySession);
    }

    async help(interaction) {
        const embeds = [
            new EmbedBuilder()
                .setTitle("Spotify Help Menu")
                .setDescription("This is the help menu for the Spotify commands.")
                .addFields(
                    {
                        name: "User Commands",
                        value: "Use these commands to authorize the bot, show your profile information or deauthorize the bot.",
                        inline: false
                    },
                    {name: "Playlist Commands", value: "These commands are used to create playlists.", inline: false},
                    {name: " ", value: "Go to the next page to see the commands.", inline: false}
                ),
            new EmbedBuilder()
                .setTitle("User Commands")
                .setDescription("Use these commands to authorize the bot, show your profile information or deauthorize the bot.")
                .addFields(
                    {name: "Authorize", value: "Authorize the bot to access your spotify account.", inline: false},
                    {name: "Me", value: "Get information about your spotify account.", inline: false},
                    {name: "Logout", value: "Deauthorize the bot.", inline: false}
                )
        ];

        await createPaginatedEmbed(interaction, embeds, 1, false, '', interaction.options.getBoolean('ephemeral') || false);
    }
}

export default new SpotifyCommand();