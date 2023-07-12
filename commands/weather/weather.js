const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const Weather = require("../../Api/Weather/Weather");
const apiUrl = process.env.WEATHER_API_URL;
const apiKey = process.env.WEATHER_API_KEY;

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
            )
            .addStringOption(option =>
                option.setName('city')
                    .setDescription('The city to get the weather for')
                    .setRequired(true)
            )
    );
});


module.exports = {
    cooldown: 30,
    data: commandBuilder,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand().charAt(0).toUpperCase() + interaction.options.getSubcommand().slice(1);
        const subCommandDir = `${__dirname}/subCommands/Weather`;

        const commandPath = `${subCommandDir}/${subcommand}`;
        const command = require(commandPath);
        const weatherSession = new Weather(apiUrl, apiKey);

        return command.execute(interaction, weatherSession);
    },
};

