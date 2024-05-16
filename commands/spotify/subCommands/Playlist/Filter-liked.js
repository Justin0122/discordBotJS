import {EmbedBuilder} from 'discord.js'
import config from '../../../../botconfig/embed.json' assert {type: "json"}
import ErrorUtils from '../../../../Utils/Error.js'

const queue = [];
let isProcessing = false;

export default {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const response = await spotifySession.getUser(interaction.user.id);
        const user = response.body;
        const status = response.status;
        if (response.body.error) {
            await ErrorUtils.sendErrorMessage(interaction, response.body.error);
            return;
        }

        if (!user) {
            await ErrorUtils.sendErrorMessage(interaction);
            return;
        }

        const filter = interaction.options.getString('filter');
        let value = interaction.options.getString('value');

        // Split the value by ',' and remove empty strings
        const values = value.split(',').map(v => v.trim()).filter(v => v);

        try {
            let playlist = await spotifySession.filterLikedTracks(interaction.user.id, values.map(v => `${filter}:${v}`));
            playlist = playlist.body;
            const embeds = [];
            if (playlist) {
                const embed = new EmbedBuilder()
                    .setColor(config.color_success)
                    .setTitle('Playlist Created')
                    .setDescription(`Please wait while your playlist is being created.`)
                    .setTimestamp()
                    .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

                await interaction.reply({embeds: [embed], ephemeral});
                if (interaction.options.getBoolean('notify')) {
                    await interaction.followUp({content: `<@${interaction.user.id}>`, ephemeral: true});
                }
            } else {
                const embed = new EmbedBuilder()
                    .setColor(config.color_error)
                    .setTitle('No Tracks Found')
                    .setDescription('No songs found for the filter.')
                    .setTimestamp();
                await interaction.reply({embeds: [embed], ephemeral});
            }
        } catch (error) {
            console.log(error);
            const embed = new EmbedBuilder()
                .setColor(config.color_error)
                .setTitle('Error')
                .setDescription('Failed to create the playlist.')
                .setTimestamp();

            await interaction.reply({embeds: [embed], ephemeral});
        }
    }
}