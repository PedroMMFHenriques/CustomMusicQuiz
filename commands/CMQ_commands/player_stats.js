const {ApplicationCommandOptionType} = require('discord.js');

module.exports = {
    name: 'stats',
    description: 'Check stats for a player.',
    options: [
        {
            name: 'user',
            description: 'The user to check stats for.',
            required: true,
            type: ApplicationCommandOptionType.User,
        },
    ],
    execute(interaction) {
        const user_id = interaction.options.get('user').value;
        const user_idx = global.player_stats.users.findIndex(object => {return object.id.toString() === user_id;});
        const user = global.player_stats.users[user_idx];
        
        const statsEmbed = {
            color: 0x19c12d,
            title: "",
            description: "**Stats for** <@" + user.id + ">\nGames won: " + user.games_won + "\nGames played: " + user.games_played + "\nRounds won: " + user.rounds_won + "\nPoints: " + user.points,
        };

        return void interaction.reply({
            embeds: [statsEmbed]
        });
    },
};
