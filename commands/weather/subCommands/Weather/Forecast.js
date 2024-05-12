import WeatherConditions from '../../../../Utils/Weather/weatherConditions'
import {moonPhases} from "../../../../Utils/Weather/weatherConditions"
import {createPaginatedEmbed} from "../../../../Utils/Pagination"

export default {
    async execute(interaction, weatherSession) {
    const {EmbedBuilder} = require("discord.js");
    const country = interaction.options.getString('country');
    const city = interaction.options.getString('city');
    const ephemeral = interaction.options.getBoolean('ephemeral');
    const forecastData = await weatherSession.getForecast(country, city);
    const location = forecastData.location;
    const forecastDays = forecastData.forecast.forecastday;

    const embeds = forecastDays.map(forecastDay => {
        const day = forecastDay.day;
        const astro = forecastDay.astro;

        const condition = Object.keys(WeatherConditions.weatherConditions).find(condition =>
           day.condition.text.toLowerCase().includes(condition)
        );

        let color = WeatherConditions.weatherConditions.default?.color || '#00ff00'; // Default color
        let emoji = '';

        if (condition) {
            color = WeatherConditions.weatherConditions[condition].color;
            emoji = WeatherConditions.weatherConditions[condition].emoji;
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
    });
    const currentPage = 1;

    await createPaginatedEmbed(interaction, embeds, currentPage, '', '', ephemeral);
    }
}