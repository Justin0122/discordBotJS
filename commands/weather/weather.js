const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const Weather = require("../../Api/Weather/Weather");
const apiUrl = process.env.WEATHER_API_URL;
const apiKey = process.env.WEATHER_API_KEY;
const countries = require('../../Utils/Weather/countries.json')
const cities = require('../../Utils/Weather/cities.json')

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



module.exports = {
    cooldown: 30,
    data: commandBuilder,

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

            if (!interaction.options.get('country') || !countries.map(country => country.name.toLowerCase()).includes(country.toLowerCase())){
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
            choices.map(choice => ({ name: choice, value: choice })),
        );
    },

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand().charAt(0).toUpperCase() + interaction.options.getSubcommand().slice(1);
        const subCommandDir = `${__dirname}/subCommands/Weather`;

        const commandPath = `${subCommandDir}/${subcommand}`;
        const command = require(commandPath);
        const weatherSession = new Weather(apiUrl, apiKey);

        return command.execute(interaction, weatherSession);
    },
};

