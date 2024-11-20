const {ApplicationCommandOptionType} = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'help',
    description: 'List available commands for a mode.',
    options: [
        {
            name: 'mode',
            description: 'List available commands for this mode.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: 'music', value: 'music' },
                { name: 'CMQ', value: 'cmq' },
            ]
            
        },
    ],
    execute(interaction) {
        let str = '';
        const mode = interaction.options.get('mode').value

        if(mode === "music"){
            var commandFiles = fs.readdirSync('./commands/music_commands').filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`./${file}`);
                str += `**${command.name}:** ${command.description}\n`;
            }
        }
        else{
            var commandFiles = fs.readdirSync('./commands/CMQ_commands').filter(file => file.endsWith('.js'));
            for (const file of commandFiles) {
                const command = require(`../CMQ_commands/${file}`);
                str += `**${command.name}:** ${command.description}\n`;
            }
        }
        
        const helpEmbed = {
            color: 0x19c12d,
            title: `Commands for ${mode} mode`,
            description: '',
            fields: [
                {
                "name": `Commands:`,
                "value": str
                }
            ],
        };

        return void interaction.reply({
            ephemeral: true,
            embeds: [helpEmbed]
        });
    },
};
