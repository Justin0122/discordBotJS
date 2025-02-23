import ErrorUtils from '../Utils/Embed/Error.js'

export class Command {
    constructor() {
        this.category = '';
        this.data = {};
    }

    async execute(interaction) {
        interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
        await this.sendErrorMessage(interaction, 'This command has not been implemented yet.');
    }

    async autocomplete(interaction) {
        await this.sendErrorMessage(interaction, 'This command doesn\'t support autocomplete.');
    }

    async help(interaction) {
        await this.sendErrorMessage(interaction, 'This command doesn\'t have a help command.');
    }

    getCommonOptions(interaction) {
        const ephemeral = interaction.options.getBoolean('ephemeral') ? interaction.options.getBoolean('ephemeral') : false;
        const discordUser = interaction.options.getUser('user') || interaction.user;
        return { ephemeral, discordUser };
    }

    async getUser(interaction, spotifySession, discordUser) {
        let user;
        if (discordUser) {
            user = await spotifySession.getUser(discordUser.id);
            user = user.body;
            if (user.error) {
                await this.sendErrorMessage(interaction, user.error);
                return null;
            }
            if (!user || !user.displayName) {
                await this.sendErrorMessage(interaction, user.error, 'Please try again later.', 'Ask the user to authorize the bot.');
                return null;
            }
        } else {
            user = await spotifySession.getUser(interaction.user.id);
            user = user.body;
        }
        return user;
    }

    async sendErrorMessage(interaction, description, solution, note ) {
        await ErrorUtils.sendErrorMessage(interaction, description, solution, note);
    }
}