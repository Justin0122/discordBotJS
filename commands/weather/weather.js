const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Weather = require('../../Api/Weather/Weather');
const { createPaginatedEmbed } = require("../../Utils/Pagination");
const apiUrl = process.env.WEATHER_API_URL;
const apiKey = process.env.WEATHER_API_KEY;

const weatherConditions = {
    sunny: {
        color: '#ffff00',
        emoji: '🌞',
    },
    'patchy rain': {
        color: '#adfffc',
        emoji: '🌧️',
    },
    rain: {
        color: '#0000ff',
        emoji: '🌧️',
    },
    cloudy: {
        color: '#808080',
        emoji: '🌤',
    },
    overcast: {
        color: '#808080',
        emoji: '🌥',
    },
    snow: {
        color: '#ffffff',
        emoji: '❄️',
    },
    thunderstorm: {
        color: '#800080',
        emoji: '⛈️',
    },
    fog: {
        color: '#808080',
        emoji: '🌫️',
    },
    mist: {
        color: '#808080',
        emoji: '🌫️',
    },
    haze: {
        color: '#808080',
        emoji: '🌫️',
    },
    drizzle: {
        color: '#808080',
        emoji: '🌧️',
    },
    freezing: {
        color: '#ffffff',
        emoji: '❄️',
    },
};

const moonPhases = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘',
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

            let emoji;
            if (choice === 'current') {
                const weatherData = await weatherSession.getWeather(country, city);
                const location = weatherData.location;
                const current = weatherData.current;
                let color = '#00ff00'; // Default color

                const condition = Object.keys(weatherConditions).find(condition =>
                    current.condition.text.toLowerCase().includes(condition)
                );

                if (condition) {
                    color = weatherConditions[condition].color;
                    emoji = weatherConditions[condition].emoji;
                }

                const embed = new EmbedBuilder()
                    .setTitle('Weather')
                    .setDescription(`${location.name}, ${location.region}, ${location.country}\n\`\`${current.condition.text}\`\`\n\`\`\`
${emoji} Temperature: ${current.temp_c}°C
${emoji} Feels Like: ${current.feelslike_c}°C
💦 Humidity: ${current.humidity}%
🍃 Wind: ${current.wind_kph}km/h
🧭 Wind Dir: ${current.wind_dir}
🌧️ Rain: ${current.precip_mm}mm
🌥 Cloud Cover: ${current.cloud}%
🌀 Pressure: ${current.pressure_mb}mb
🌞 UV Index: ${current.uv}
\`\`\`Last Updated: ${current.last_updated}
                    `)
                    .setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() })
                    .setTimestamp()
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

                    const condition = Object.keys(weatherConditions).find(condition =>
                        day.condition.text.toLowerCase().includes(condition)
                    );

                    let color = weatherConditions.default?.color || '#00ff00'; // Default color
                    let emoji = '';

                    if (condition) {
                        color = weatherConditions[condition].color;
                        emoji = weatherConditions[condition].emoji;
                    }

                    const date = new Date(forecastDay.date);
                    const dayOfWeek = date.toLocaleDateString('en-US', {weekday: 'long'});
                    const month = date.toLocaleDateString('en-US', {month: 'long'});
                    const dayOfMonth = date.toLocaleDateString('en-US', {day: 'numeric'});

                    function getOrdinalSuffix(day) {
                        const suffixes = ['th', 'st', 'nd', 'rd'];
                        const relevantDigits = (day < 30) ? day % 20 : day % 30;
                        const suffix = (relevantDigits <= 3 && relevantDigits >= 1) ? suffixes[relevantDigits] : suffixes[0];
                        return day + suffix;
                    }

                    const moonPhaseDescription = astro.moon_phase;
                    const moonPhaseEmoji = Object.entries(moonPhases).find(([phase]) =>
                        moonPhaseDescription.includes(phase)
                    )?.[1] || '';

                    const formattedDayOfMonth = getOrdinalSuffix(parseInt(dayOfMonth));

                    return new EmbedBuilder()
                        .setTitle('Weather Forecast for ' + dayOfWeek + ', ' + month + ' ' + formattedDayOfMonth)
                        .setDescription(`${location.name}, ${location.region}, ${location.country}\n\`\`${day.condition.text}\`\`\n\`\`\`
${emoji} ${day.maxtemp_c}°C / ${day.mintemp_c}°C
🍃 Winds: ${day.maxwind_kph}km/h
🌧️ Rain: ${day.totalprecip_mm}mm
👀 Visibility: ${day.avgvis_km}km
🌞 UV Index: ${day.uv}\`\`\`
🌅 Sunrise: \`${astro.sunrise}\`
🌇 Sunset: \`${astro.sunset}\`
${moonPhaseEmoji} Moon phase: \`${astro.moon_phase}\``)
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
