const { SlashCommandBuilder } = require('discord.js');
const puppeteer = require('puppeteer');

module.exports = {
    cooldown: 10,
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Search something on Google')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The query to search')
                .setRequired(true))
        .addBooleanOption(option =>
            option.setName('safe')
                .setDescription('Safe search')
                .setRequired(false))
        .addBooleanOption( option =>
            option.setName('ephemeral')
                .setDescription('Should the response be ephemeral?')
                .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: interaction.options.getBoolean('ephemeral') });
        const query = interaction.options.getString('query');
        const safe = interaction.options.getBoolean('safe') ? 'on' : 'off';
        const link = `https://www.google.com/search?q=${encodeURIComponent(query)}&safe=${safe}&hl=en`;

        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();
        await page.goto(link, { waitUntil: 'domcontentloaded' });

        const links = await page.evaluate(() => {
            const links = [];
            const elements = document.querySelectorAll('.tF2Cxc');
            elements.forEach((element) => {
                const link = element.querySelector('a');
                if (link && link.href) {
                    links.push(link.href);
                }
            });
            return links;
        });

        await browser.close();
        await interaction.editReply(links[0] || 'No results found');
    },
};
