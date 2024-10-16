import { Events, Collection, EmbedBuilder} from 'discord.js';
import config from "../botconfig/embed.json" with {type: "json"};
import ErrorUtils from '../Utils/Embed/Error.js'

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isMessageContextMenuCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            try {
                await command.execute(interaction);
            } catch (error) {
                console.log(error);
            }
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;

        const { cooldowns } = interaction.client;

        if (!cooldowns.has(command.data.name)) {
            cooldowns.set(command.data.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(command.data.name);
        const defaultCooldownDuration = 2;
        const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime && interaction.guildId !== process.env.DISCORD_DEV_GUILD) {
                const expiredTimestamp = Math.floor(expirationTime / 1000);
                const descriptionTime = `<t:${expiredTimestamp}:R>`;
                return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again ${descriptionTime}.`, ephemeral: true });
            }
        }

        timestamps.set(interaction.user.id, now);
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

        try {
            const embed = await command.execute(interaction);

            if (!embed) return;

            await embed.setColor(config.success);
            embed.setFooter({ text: interaction.user.username, iconURL: interaction.user.avatarURL() });
            embed.setTimestamp();

            const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
            if (ephemeral) {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            else {
                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.log(error);
            await ErrorUtils.sendErrorMessage(interaction, "An error occurred.", "Please try again later.");
        }
    },
};
