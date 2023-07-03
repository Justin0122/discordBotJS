const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Weather = require('../../Handlers/Weather/Weather');
const { createPaginatedEmbed } = require("../../Handlers/Pagination");
const apiUrl = process.env.WEATHER_API_URL;
const apiKey = process.env.WEATHER_API_KEY;

const weatherConditions = {
    sunny: '#ffff00',
    'patchy rain': '#adfffc',
    rain: '#0000ff',
    cloudy: '#808080',
    overcast: '#808080',
    snow: '#ffffff',
    thunderstorm: '#800080',
    fog: '#808080',
    mist: '#808080',
    haze: '#808080',
    drizzle: '#808080'
};

module.exports = {
    cooldown: 30,
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Use one of the options to get the weather or forecast for a location')
        .addStringOption(option =>
            option
                .setName('country')
                .setDescription('The country to get the weather for')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('city')
                .setDescription('The city to get the weather for')
                .setRequired(false)
        )
        .addStringOption(option =>
            option
                .setName('choice')
                .setDescription('current weather, forecast.')
                .setRequired(false)
                .addChoices(
                    { name: 'current weather', value: 'current' },
                    { name: 'forecast', value: 'forecast' }
                )
        )
        .addBooleanOption(option =>
            option
                .setName('ephemeral')
                .setDescription('Whether the reply should be ephemeral')
                .setRequired(false)
        ),

    async execute(interaction) {
        return new Promise(async (resolve, reject) => {
            const country = interaction.options.getString('country');
            const city = interaction.options.getString('city');
            const choice = interaction.options.getString('choice');
            const ephemeral = interaction.options.getBoolean('ephemeral');
            const weatherSession = new Weather(apiUrl, apiKey);

            if (choice === 'current') {
                const weatherData = await weatherSession.getWeather(country, city);
                const location = weatherData.location;
                const current = weatherData.current;
                let color = '#00ff00'; // Default color

                const condition = Object.keys(weatherConditions).find(condition =>
                    current.condition.text.toLowerCase().includes(condition)
                );

                if (condition) {
                    color = weatherConditions[condition];
                }
                const embed = new EmbedBuilder()
                    .setTitle('Weather')
                    .setDescription(`Weather for ${location.name}, ${location.region}, ${location.country}\n\`${current.condition.text}\``)
                    .addFields(
                        { name: 'Temperature', value: `${current.temp_c}°C`, inline: true },
                        { name: 'Humidity', value: `${current.humidity}%`, inline: true },
                        { name: 'Wind Speed', value: `${current.wind_kph}km/h`, inline: true },
                        { name: 'Feels Like', value: `${current.feelslike_c}°C`, inline: true },
                        { name: 'Precipitation', value: `${current.precip_mm}mm`, inline: true },
                        { name: 'Wind Direction', value: `${current.wind_dir}`, inline: true },
                        { name: 'Cloud Cover', value: `${current.cloud}%`, inline: true },
                        { name: 'Pressure', value: `${current.pressure_mb}mb`, inline: true },
                        { name: 'UV Index', value: `${current.uv}`, inline: true },
                        { name: 'Last Updated', value: `${current.last_updated}`, inline: false }
                    )
                    .setThumbnail(`https:${current.condition.icon}`)
                    .setColor(color); // Set the dynamically determined color

                interaction.reply({
                    embeds: [embed],
                    ephemeral: ephemeral
                });
            } else if (choice === 'forecast') {
                if (ephemeral) {
                    reject(new Error('You cannot use ephemeral with this command'));
                    return;
                }
                const forecastData = await weatherSession.getForecast(country, city);
                const location = forecastData.location;
                const forecastDays = forecastData.forecast.forecastday;

                const embeds = forecastDays.map(forecastDay => {
                    const day = forecastDay.day;
                    const astro = forecastDay.astro;

                    let color = weatherConditions.default || '#00ff00'; // Default color
                    const condition = Object.keys(weatherConditions).find(condition =>
                        day.condition.text.toLowerCase().includes(condition)
                    );

                    if (condition) {
                        color = weatherConditions[condition];
                    }

                    return new EmbedBuilder()
                        .setTitle('Weather Forecast for ' + forecastDay.date)
                        .setDescription(`Weather forecast for ${location.name}, ${location.region}, ${location.country}\n\`${day.condition.text}\``)
                        .addFields(
                            { name: 'Temperature', value: `${day.avgtemp_c}°C`, inline: true },
                            { name: 'Humidity', value: `${day.avghumidity}%`, inline: true },
                            { name: 'Wind Speed', value: `${day.maxwind_kph}km/h`, inline: true },
                            { name: 'Precipitation', value: `${day.totalprecip_mm}mm`, inline: true },
                            { name: 'Cloud Cover', value: `${day.avgvis_km}km`, inline: true },
                            { name: 'Pressure', value: `${day.avgvis_km}mb`, inline: true },
                            { name: 'UV Index', value: `${day.uv}`, inline: true },
                            { name: 'Sunrise', value: `${astro.sunrise}`, inline: true },
                            { name: 'Sunset', value: `${astro.sunset}`, inline: true }
                        )
                        .setThumbnail(`https:${day.condition.icon}`)
                        .setColor(color)
                        .setFooter({
                            text: `${interaction.user.username} - page: ${forecastDays.indexOf(forecastDay) + 1}/${forecastDays.length}`,
                            iconURL: interaction.user.avatarURL()
                        });
                });

                const currentPage = 1;

                await createPaginatedEmbed(interaction, embeds, currentPage);
            }
        });
    },
};
