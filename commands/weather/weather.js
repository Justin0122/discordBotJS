import {SlashCommandBuilder, EmbedBuilder} from 'discord.js';
import fs from 'fs';
import Weather from "../../Api/Weather/Weather.js";
import countries from '../../Utils/Weather/countries.json' assert {type: "json"};
import cities from '../../Utils/Weather/cities.json' assert {type: "json"};
import {createPaginatedEmbed} from "../../Utils/Embed/Pagination.js";
import {fileURLToPath} from 'url';
import {dirname, join} from 'path';
import dotenv from 'dotenv';
import {Command} from '../Command.js'

dotenv.config();

const apiUrl = process.env.WEATHER_API_URL;
const apiKey = process.env.WEATHER_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const subCommandFiles = fs.readdirSync(`${__dirname}/subCommands/Weather`).filter(file => file.endsWith('.js'));
const subCommands = subCommandFiles.map(file => file.split('.')[0]);

const commandBuilder = new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get the weather for a location');
subCommands.forEach(subCommand => {
    commandBuilder.addSubcommand(subcommand =>
        subcommand
            .setName(subCommand.toLowerCase())
            .setDescription(`Get the ${subCommand.toLowerCase()} weather for a location`)
            .addStringOption(option =>
                option.setName('country')
                    .setDescription('The country to get the weather for')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption(option =>
                option.setName('city')
                    .setDescription('The city to get the weather for')
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addBooleanOption(option =>
                option.setName('ephemeral')
                    .setDescription('Whether to send the message as an ephemeral message')
                    .setRequired(false)
            )
    );
});

class WeatherCommand extends Command {
    constructor() {
        super();
        this.category = 'Weather';
        this.cooldown = 30;
        this.data = commandBuilder;
    }

    async autocomplete(interaction) {
        let focusedOption = interaction.options.getFocused(true);
        let choices = [];

        if (focusedOption.name === 'country') {
            const countryNames = countries.map(country => country.name);
            choices = countryNames
                .filter(countryName => countryName.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
                .sort((a, b) => a.localeCompare(b))
                .slice(0, 25);
        }

        if (focusedOption.name === 'city') {
            const country = interaction.options.get('country').value

            if (!interaction.options.get('country') || !countries.map(country => country.name.toLowerCase()).includes(country.toLowerCase())) {
                return;
            }
            const code = countries.find(countryObj => countryObj.name.toLowerCase() === country.toLowerCase()).code;
            const filteredCities = cities.filter(city => city.country === code);
            const cityNames = filteredCities.map(city => city.name);
            choices = cityNames
                .filter(cityName => cityName.toLowerCase().startsWith(focusedOption.value.toLowerCase()))
                .sort((a, b) => a.localeCompare(b))
                .slice(0, 25);
        }
        await interaction.respond(
            choices.map(choice => ({name: choice, value: choice})),
        );
    }

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand().charAt(0).toUpperCase() + interaction.options.getSubcommand().slice(1);
        const subcommandGroup = 'Weather';

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);

        const subCommandDir = join(__dirname, 'subCommands', subcommandGroup);
        const commandPath = `${subCommandDir}/${subcommand}.js`;

        const commandModule = await import(commandPath);
        const CommandClass = commandModule.default;

        const command = new CommandClass();

        const weatherSession = new Weather(apiUrl, apiKey);

        return command.execute(interaction, weatherSession);
    }

    async help(interaction) {
        const embeds = [];
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;

        const firstPage = new EmbedBuilder()
            .setTitle("Weather")
            .setDescription(`Get the weather or forecast for a location`)
            .addFields(
                {name: "Sub Commands", value: subCommands.map(subCommand => `\`${subCommand}\``).join(", ")}
            )
        embeds.push(firstPage);

        const secondPage = new EmbedBuilder()
            .setTitle("UV Index")
            .setDescription(`When should you wear sunscreen?`)
            .setImage('https://www.jeunesse.co.nz/wp-content/uploads/2020/02/UV-INDEX.png')
        embeds.push(secondPage);

        const thirdPage = new EmbedBuilder()
            .setTitle("Wind direction")
            .setDescription(`How to read the wind direction`)
            .setImage('https://www.surfertoday.com/images/stories/compassrose.jpg')
        embeds.push(thirdPage);

        await createPaginatedEmbed(interaction, embeds, 1, false, '', ephemeral);

    }
}

export default new WeatherCommand();