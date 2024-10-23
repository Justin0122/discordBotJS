import {EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} from 'discord.js'
import config from '../../../../botconfig/embed.json' with {type: "json"}
import SpotifyUtils from '../../../../Utils/Spotify.js'
import {Command} from "../../../Command.js";

class SpotifyLiked extends Command {

    async execute(interaction, spotifySession) {
        const ephemeral = interaction.options.getBoolean('ephemeral') || false;
        const user = await spotifySession.getUser(interaction.user.id);
        if (user.body.error) {
            await this.sendErrorMessage(interaction, user.body.error);
            return;
        }

        if (!user) {
            await this.sendErrorMessage(interaction);
            return;
        }

        const month = interaction.options.getString('month');
        const year = interaction.options.getString('year');

        const playlistName = `Liked Songs from ${new Date(year, month - 1, 1).toLocaleString('en-US', {month: 'short'})} ${year}.`;

        const embed = new EmbedBuilder()
            .setColor(config.info)
            .setTitle('Creating Playlist')
            .setDescription('Please wait while the playlist is being created.')
            .addFields(
                {name: 'Month', value: month, inline: true},
                {name: 'Year', value: year, inline: true},
                {name: 'Playlist Name', value: playlistName, inline: true},
            )
            .setTimestamp();

        await interaction.reply({embeds: [embed], ephemeral: ephemeral});

        let playlist = await spotifySession.createPlaylist(interaction.user.id, playlistName, month, year);
        const audioFeaturesDescription = await SpotifyUtils.audioFeatures(spotifySession, playlist.body, interaction);
        playlist = playlist.body;

        const embeds = [];
        if (playlist) {
            const embed = new EmbedBuilder()
                .setColor(config.success)
                .setTitle('Playlist Created')
                .setDescription(audioFeaturesDescription)
                .setURL(playlist.external_urls.spotify)
                .addFields({name: 'Name', value: playlist.name, inline: true},
                    {name: 'Total Tracks', value: playlist.tracks.total.toString(), inline: true},
                    {
                        name: 'Owner', value: playlist.owner.display_name, inline: true
                    })
                .setThumbnail(playlist.images[0].url)
                .setTimestamp()
                .setFooter({text: interaction.user.username, iconURL: interaction.user.avatarURL()});

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('View Playlist')
                        .setStyle(ButtonStyle.Link)
                        .setURL(playlist.external_urls.spotify),
                );

            await interaction.editReply({embeds: [embed], components: [row], ephemeral});
            if (interaction.options.getBoolean('notify')) {
                //ping the user
                await interaction.followUp({content: `<@${interaction.user.id}>`, ephemeral: true});
            }
        } else {
            const embed = new EmbedBuilder()
                .setColor(config.error)
                .setTitle('No Tracks Found')
                .setDescription('No songs found for the specified month.')
                .setTimestamp();

            await interaction.editReply({embeds: [embed], ephemeral});
        }
    }
}

export default SpotifyLiked;