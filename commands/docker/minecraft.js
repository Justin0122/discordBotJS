import {SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js';
import config from "../../botconfig/embed.json" assert {type: "json"};
import {createPaginatedEmbed} from "../../Utils/Embed/Pagination.js";
import {Command} from '../Command.js';

class ManageServer extends Command {
    constructor() {
        super();
        this.category = 'docker';
        this.cooldown = 5;
        this.data = new SlashCommandBuilder()
            .setName('server')
            .setDescription('Manage the Minecraft server')
            .addStringOption((option) =>
                option.setName('action').setDescription('The action to perform').setRequired(true)
                    .addChoices(
                        {name: 'Start', value: 'start'},
                        {name: 'Stop', value: 'stop'},
                        {name: 'Restart', value: 'restart'},
                        {name: 'Status', value: 'status'},
                    )
            );
    }

    async execute(interaction) {
        const baseUrl = `${process.env.PORTAINER_URL}/endpoints/2/docker/containers/${process.env.PORTAINER_CONTAINER}/`;
        const action = interaction.options.getString('action');

        // Defer the reply to allow more time for processing
        await interaction.deferReply();

        if (['start', 'stop', 'restart'].includes(action)) {
            await this.performAction(interaction, baseUrl, action);

            // If action is start, stop or restart, send a basic status message without buttons
            await interaction.editReply(`${action.charAt(0).toUpperCase() + action.slice(1)} the server`);

        } else if (action === 'status') {
            await this.getStatus(interaction, baseUrl);

            // Setup interaction collector for button presses only when needed
            const filter = (i) => ['start', 'stop', 'restart', 'status'].includes(i.customId) && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({filter, time: 240000}); // 240 seconds

            collector.on('collect', async (i) => {
                if (i.customId === 'start') {
                    await this.performAction(interaction, baseUrl, 'start');
                    await this.updateStatusEmbed(interaction, baseUrl, '#00ff00'); // Green
                } else if (i.customId === 'stop') {
                    await this.performAction(interaction, baseUrl, 'stop');
                    await this.updateStatusEmbed(interaction, baseUrl, '#ff0000'); // Red
                } else if (i.customId === 'restart') {
                    await this.performAction(interaction, baseUrl, 'restart');
                    await this.getStatus(interaction, baseUrl);
                } else if (i.customId === 'status') {
                    await this.getStatus(interaction, baseUrl);
                }

                // Acknowledge the button interaction by changing the embed with updated status
                await i.deferUpdate();
            });

            collector.on('end', async (collected, reason) => {
                // Disable the buttons after the collector ends
                const newRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Start')
                        .setCustomId('start')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel('Stop')
                        .setCustomId('stop')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setLabel('Restart')
                        .setCustomId('restart')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('Status')
                        .setCustomId('status')
                        .setDisabled(true)
                        .setStyle(ButtonStyle.Secondary)
                );

                await interaction.editReply({components: [newRow]});
            });
        }
    }

    async help(interaction) {
        // Implement help logic if needed
    }

    async performAction(interaction, baseUrl, action) {
        const url = `${baseUrl}${action}`;
        try {
            // Get the JWT token
            const token = await this.getPortainerJWT();

            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            // Make the API request
            const response = await fetch(url, {
                method: 'POST',
                headers: headers
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${responseText}`);
            }

            // Reply to the interaction
            await interaction.editReply(`${action.charAt(0).toUpperCase() + action.slice(1)} the server`);
        } catch (error) {
            console.error(`Error in ${action} method:`, error);
            await interaction.editReply(`Failed to ${action} the server`);
        }
    }

    async getStatus(interaction, baseUrl) {
        const url = `${baseUrl}json`; // Endpoint to get container status
        try {
            const token = await this.getPortainerJWT();

            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${responseText}`);
            }

            const statusData = JSON.parse(responseText);

            // Extract necessary fields for the embed
            const status = statusData.State.Status || 'Unknown';
            const running = statusData.State.Running ? 'Yes' : 'No';
            const restartCount = statusData.RestartCount || 0;
            const startTime = new Date(statusData.State.StartedAt).toLocaleString();
            const uptime = this.calculateUptime(new Date(statusData.State.StartedAt));

            let color;
            if (statusData.State.Running) {
                color = '#00ff00';
            } else {
                color = '#ff0000';
            }

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle('Server Status')
                .setDescription("Here is the current status of the Minecraft server:")
                .addFields(
                    {name: 'Container ID', value: statusData.Id, inline: false},
                    {name: 'Status', value: status, inline: true},
                    {name: 'Running', value: running, inline: true},
                    {name: 'Restart Count', value: `${restartCount}`, inline: true},
                    {name: 'Started At', value: startTime, inline: false},
                    {name: 'Uptime', value: uptime, inline: false},
                )
                .setColor(color)
                .setTimestamp()
                .setThumbnail(interaction.client.user.avatarURL() || interaction.client.user.defaultAvatarURL)
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

            // Create action row with buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Start')
                        .setCustomId('start')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel('Stop')
                        .setCustomId('stop')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setLabel('Restart')
                        .setCustomId('restart')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('Status')
                        .setCustomId('status')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Send the embed with action row
            await interaction.editReply({embeds: [embed], components: [actionRow]});
        } catch (error) {
            console.error("Error in getStatus method:", error);
            await interaction.editReply('Failed to retrieve server status');
        }
    }

    // Helper method to calculate uptime
    calculateUptime(startTime) {
        const now = new Date();
        const uptime = now - startTime;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    async getPortainerJWT() {
        const baseUrl = process.env.PORTAINER_URL;
        const url = `${baseUrl}/auth`;

        const body = {
            username: process.env.PORTAINER_USERNAME,
            password: process.env.PORTAINER_PASSWORD
        };
        const headers = {
            'Content-Type': 'application/json'
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error(`HTTP error! Status: ${response.status} - ${responseText}`); // Detailed error log
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const responseText = await response.text();

            // Parse the JSON and return the JWT token
            const data = JSON.parse(responseText);
            return data.jwt;
        } catch (error) {
            console.error("Error in getPortainerJWT method:", error);
            throw new Error('Failed to retrieve JWT token');
        }
    }

    async updateStatusEmbed(interaction, baseUrl, color) {
        const url = `${baseUrl}json`; // Endpoint to get container status
        try {
            // Make the API request to get the status
            const token = await this.getPortainerJWT();

            const headers = {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            const response = await fetch(url, {
                method: 'GET',
                headers: headers
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} - ${responseText}`);
            }

            // Parse the response to extract status information
            const statusData = JSON.parse(responseText);

            // Extract necessary fields for the embed
            const status = statusData.State.Status || 'Unknown';
            const running = statusData.State.Running ? 'Yes' : 'No';
            const restartCount = statusData.RestartCount || 0;
            const startTime = new Date(statusData.State.StartedAt).toLocaleString();
            const uptime = this.calculateUptime(new Date(statusData.State.StartedAt));

            // Create the embed
            const embed = new EmbedBuilder()
                .setTitle('Server Status')
                .setDescription("Here is the current status of the Minecraft server:")
                .addFields(
                    {name: 'Container ID', value: statusData.Id, inline: false},
                    {name: 'Status', value: status, inline: true},
                    {name: 'Running', value: running, inline: true},
                    {name: 'Restart Count', value: `${restartCount}`, inline: true},
                    {name: 'Started At', value: startTime, inline: false},
                    {name: 'Uptime', value: uptime, inline: false},
                )
                .setColor(color)
                .setTimestamp()
                .setThumbnail(interaction.client.user.avatarURL() || interaction.client.user.defaultAvatarURL)
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

            // Create action row with buttons
            const actionRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Start')
                        .setCustomId('start')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setLabel('Stop')
                        .setCustomId('stop')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setLabel('Restart')
                        .setCustomId('restart')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setLabel('Status')
                        .setCustomId('status')
                        .setStyle(ButtonStyle.Secondary)
                );

            // Send the embed with action row
            await interaction.editReply({embeds: [embed], components: [actionRow]});
        } catch (error) {
            console.error("Error in updateStatusEmbed method:", error);
            await interaction.editReply('Failed to update server status');
        }
    }
}

export default new ManageServer();
