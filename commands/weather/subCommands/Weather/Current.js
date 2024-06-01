import { EmbedBuilder } from 'discord.js'
import { weatherConditions } from '../../../../Utils/Weather/weatherConditions.js';
import WeatherStories from '../../../../Utils/Weather/weatherStories.json' assert {type: "json"}
import {SubCommand} from "../../../SubCommand.js";

class WeatherCurrent extends SubCommand {
    constructor() {
        super();
        this.category = 'Weather'
    }
    async execute(interaction, weatherSession) {
        const country = interaction.options.getString('country');
        const city = interaction.options.getString('city');
        const ephemeral = interaction.options.getBoolean('ephemeral');

        const weatherData = await weatherSession.getWeather(country, city);
        const location = weatherData.location;
        const current = weatherData.current;

        const condition = Object.keys(weatherConditions).find(condition =>
            current.condition.text.toLowerCase().includes(condition)
        );

        let color = '#00ff00'; // Default color
        let emoji;

        if (condition) {
            color = weatherConditions[condition].color;
            emoji = weatherConditions[condition].emoji;
        }
        const weatherStoryData = WeatherStories[current.condition.text][condition] || WeatherStories[current.condition.text]['default'];
        const weatherStory = weatherStoryData[current.condition.text] || weatherStoryData.default;
        const weatherStoryReplaced = weatherStory.replace('{condition}', current.condition.text).replace('{temperature}', current.temp_c);

        const embed = new EmbedBuilder()
            .setTitle('Weather')
            .setDescription(`${location.name}, ${location.region}, ${location.country}\n\`\`${weatherStoryReplaced}\`\`\n\`\`\`
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
            .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()})
            .setTimestamp()
            .setThumbnail(`https:${current.condition.icon}`)
            .setColor(color); // Set the dynamically determined color

        await interaction.reply({embeds: [embed], ephemeral: ephemeral});
    }
}

export default WeatherCurrent;