const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Weather = require('../../Api/Weather/Weather');
const { createPaginatedEmbed } = require("../../Utils/Pagination");
const apiUrl = process.env.WEATHER_API_URL;
const apiKey = process.env.WEATHER_API_KEY;

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Use one of the options to get the weather or forecast for a location')
        .addSubcommand(subcommand =>
            subcommand
                .setName('current')
                .setDescription('Get the current weather for a location')
                .addStringOption(option =>
                    option
                        .setName('country')
                        .setDescription('The country of the location')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('city')
                        .setDescription('The city of the location')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('ephemeral')
                        .setDescription('Whether the response should be ephemeral')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('forecast')
                .setDescription('Get the forecast for a location')
                .addStringOption(option =>
                    option
                        .setName('country')
                        .setDescription('The country of the location')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('city')
                        .setDescription('The city of the location')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option
                        .setName('ephemeral')
                        .setDescription('Whether the response should be ephemeral')
                        .setRequired(false)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand().charAt(0).toUpperCase() + interaction.options.getSubcommand().slice(1);
        const subCommandDir = './../../subCommands/Weather';

        const commandPath = `${subCommandDir}/${subcommand}`;
        const command = require(commandPath);
        const weatherSession = new Weather(apiUrl, apiKey);


        return command.execute(interaction, weatherSession);
    },

};
