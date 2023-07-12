const {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const WeatherConditions = require('../../../../Utils/weatherConditions');

module.exports = {
    async execute(interaction, weatherSession) {
        const country = interaction.options.getString('country');
        const city = interaction.options.getString('city');
        const ephemeral = interaction.options.getBoolean('ephemeral');

        let emoji;
            const weatherData = await weatherSession.getWeather(country, city);
            const location = weatherData.location;
            const current = weatherData.current;
            let color = '#00ff00'; // Default color

            const condition = Object.keys(WeatherConditions.weatherConditions).find(condition =>
                current.condition.text.toLowerCase().includes(condition)
            );

            if (condition) {
                color = WeatherConditions.weatherConditions[condition].color;
                emoji = WeatherConditions.weatherConditions[condition].emoji;
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

        await interaction.reply({ embeds: [embed], ephemeral: ephemeral });

    }
}