module.exports = (client) => {
    const mysql = require('mysql');
    const host = process.env.HOST;
    const user = process.env.USER;
    const password = process.env.PASSWORD;
    const database = process.env.DATABASE;

    const con = mysql.createConnection({
        host: host,
        user: user,
        password: password,
        database: database,
        socketPath: '/var/run/mysqld/mysqld.sock'
    });

    con.connect(function (err) {
        const { EmbedBuilder } = require('discord.js');
        if (err) {
            // Handle connection error
            const embed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('There was an error connecting to the database. Please try again later.\n\n' + err + '\n\n The bot can still be used, but some features will not work.')
                .setColor(0xff0000)
                .setTimestamp();
            client.channels.cache.get('1130828309119381584').send({ embeds: [embed] });
        } else {
            console.log("Connected!");
            // Create the database if it doesn't exist
            con.query(`CREATE DATABASE IF NOT EXISTS ${database}`, function (err) {
                if (err) {
                    console.log('Error creating database:', err);
                    return;
                }
                console.log('Database created or already exists');

                con.query(`USE ${database}`, function (err) {
                    if (err) {
                        console.log('Error selecting database:', err);
                        return;
                    }
                    console.log('Using database');

                    // Create tables and columns if they don't exist
                    const createTableQuery = `CREATE TABLE IF NOT EXISTS tblwords (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        word VARCHAR(255),
                        emote VARCHAR(255)
                    )`;
                    con.query(createTableQuery, function (err) {
                        if (err) {
                            console.log('Error creating tblwords table:', err);
                            return;
                        }
                        console.log('tblwords table created or already exists');
                    });
                });
            });

            // Export the connection
            console.log("Connected!");
            module.exports = { connection: con };
        }
    });
};