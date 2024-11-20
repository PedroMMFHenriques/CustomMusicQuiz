const {ApplicationCommandOptionType} = require('discord.js');

module.exports = {
    name: 'leaderboard',
    description: 'Leaderboard for CMQ.',
    options: [
        {
            name: 'criteria',
            description: 'Leaderboard for this criteria.',
            required: true,
            type: ApplicationCommandOptionType.String,
            choices: [
                { name: 'points', value: 'points' },
                { name: 'rounds_won', value: 'rounds_won' },
                { name: 'games_won', value: 'games_won' },
                { name: 'games_played', value: 'games_played' },
                { name: 'games_won', value: 'games_won' },
            ]
        },
    ],
    execute(interaction) {
        const criteria = interaction.options.get('criteria').value;
        const players_sorted = global.player_stats.users.sort((a, b) => {return b[criteria] - a[criteria];});
        let criteria_str = "";
        for(let i=0; i < global.player_stats.users.length; i++){
            if(players_sorted[i][criteria] != 0)
                criteria_str = criteria_str + "<@" + players_sorted[i].id + ">: " + players_sorted[i][criteria].toFixed(2) + "\n";
        }
        
        const scoreEmbed = {
            color: 0x19c12d,
            title: `Player leaderboards for ${criteria}`,
            description: criteria_str,
        };

        return void interaction.reply({
            embeds: [scoreEmbed]
        });
    },
};
