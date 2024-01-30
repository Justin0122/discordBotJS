const { EmbedBuilder } = require("discord.js");
const { connection } = require('../database/connect.js');

module.exports = (client) => {
    client.on('messageCreate', message => {
        if (message.author.bot) {
            if (message.content.includes('Pong')) {
                message.react('🏓');
                message.react(':peepoping:');
            }
        } else {
            try {
                connection.query("SELECT * FROM tblwords INNER JOIN tblemotes ON fkemoteid = tblemotes.id", function (err, result, fields) {
                    if (err) throw err;
                    result.forEach(word => {
                        const regex = new RegExp(`\\b${word.word}\\b|^${word.word}\\b|\\b${word.word}$`, 'i');
                        if (regex.test(message.content)) {
                            message.react(word.emote);
                        }
                    });
                });
            } catch (err) {
                console.log(err);
                const embed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription(`An error occurred while trying to react to a message.\n\n**Error:** ${err}`)
                    .setColor('#ff0000')
                    .setTimestamp();

                client.channels.cache.get('1130828309119381584').send({ embeds: [embed] });
            }
        }
    });
};