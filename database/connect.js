odule.exports = (client) => {

    //create a connection to the database
    var mysql = require('mysql');
    var host = process.env.HOST;
    var user = process.env.USER;
    var password = process.env.PASSWORD;
    var database = process.env.DATABASE;


    var con = mysql.createConnection({
        host: host,
        user: user,
        password: password,
        database: database,
        socketPath: '/var/run/mysqld/mysqld.sock' //this is for linux
    });

    //connect to the database
    con.connect(function (err) {
        //require embedbuilder
        const { EmbedBuilder } = require('discord.js');
        if (err) {
            //log the error using the log function in functions/log.js
            log(err);
            //create an embed with the error
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('There was an error connecting to the database. Please try again later.\n\n' + err + '\n\n The bot can still be used, but some features will not work.')
                .setColor(0xff0000)
                .setTimestamp();
            //send the embed in the log channel
            client.channels.cache.get('1033726233684492391').send({ embeds: [embed] });
            return;
        } else {
            console.log("Connected!");
            module.exports = con;
        }
    });
}
