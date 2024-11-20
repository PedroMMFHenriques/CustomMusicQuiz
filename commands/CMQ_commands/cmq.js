const {ApplicationCommandOptionType} = require('discord.js');
const {useQueue} = require("discord-player");
const {isInVoiceChannel} = require("../utils/voicechannel");
const {cmq_master, clear_cmq_data} = require("../../main/CMQ_master");


class CMQ_settings{
    constructor(n_rounds, round_time, title_max_songs, anime, game, other, inserts, watched, guess) {
        this.n_rounds = n_rounds;
        this.round_time = round_time;
        this.title_max_songs = title_max_songs;
        this.anime = anime;
        this.game = game;
        this.other = other;
        this.inserts = inserts;
        this.watched = watched;
        this.guess = guess;
    }
}

module.exports = {
    name: 'cmq',
    description: 'Starts a Custom Music Quiz session.',
    options: [
        {
            name: 'n_rounds',
            type: ApplicationCommandOptionType.Integer,
            description: 'Number of rounds of the game (1 song per round). [Default 20]',
            required: false,
        },
        {
            name: 'round_time',
            type: ApplicationCommandOptionType.Integer,
            description: 'How many seconds each round will be. [Default 30]',
            required: false,
        },
        {
            name: 'title_max_songs',
            type: ApplicationCommandOptionType.Integer,
            description: 'The maximum amount of songs per title. [Default 3]',
            required: false,
        },
        {
            name: 'anime',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Enable anime music. [Default True]',
            required: false,
        },
        {
            name: 'game',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Enable game music. [Default False]',
            required: false,
        },
        {
            name: 'other',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Enable tv/film/internet music. [Default False]',
            required: false,
        },
        {
            name: 'inserts',
            type: ApplicationCommandOptionType.Boolean,
            description: 'Enable anime inserts. [Default False]',
            required: false,
        },
        {
            name: 'watched',
            type: ApplicationCommandOptionType.String,
            description: 'Only choose music from media that each player watched/everyone watched/all songs. [Default Union]',
            required: false,
            choices: [
                { name: 'union', value: 'union' },
                { name: 'intersection', value: 'intersection' },
                { name: 'all', value: 'all' },
            ]
        },
        {
            name: 'guess',
            type: ApplicationCommandOptionType.String,
            description: 'Guess the title of the media/song name/artist name. [Default Title]',
            required: false,
            choices: [
                { name: 'title', value: 'title' },
                { name: 'song', value: 'song' },
                { name: 'artist', value: 'artist' },
            ]
        },
    ],
    async execute(interaction) {
        const inVoiceChannel = isInVoiceChannel(interaction)
        if (!inVoiceChannel) {
            return
        }

        if(global.cmq_data.gameRunning === true){
            return void interaction.reply({
                content: '❌ | A CMQ session is already running!',
                ephemeral: true,
            });
        }

        if(global.mbr_data.gameRunning === true){
            return void interaction.reply({
                content: '❌ | A MBR session is running!',
                ephemeral: true,
            });
        }
        
        const queue = useQueue(interaction.guild.id)
        if (queue && queue.currentTrack){
            return void interaction.reply({
                content: "❌ | Can't start CMQ while I'm playing music!",
                ephemeral: true,
            });
        }
        
        /*await interaction.deferReply();*/

        global.game_settings = get_game_settings(interaction);
        if(global.game_settings.anime === false && global.game_settings.game === false && global.game_settings.other === false)
            return void interaction.reply({
                content: "❌ | You have to enable at least one of Anime, Game or Other!",
                ephemeral: true,
            });

        global.cmq_data.gameRunning = true;
        global.cmq_data.voice_chat = interaction.member.voice.channelId;


        const player_ids = [];

        const role_id = global.cmq_role; /* Role to ping who wants to play CMQ */

        interaction.reply({content: "Starting CMQ with you as the lobby owner.", ephemeral: true});

        const gameEmbed = {
            color: 0x19c12d,
            title: "CMQ is starting!",
            description: '',
            fields: [
                {
                "name": `React with 👍 to participate!`,
                "value": `Lobby owner can  ⏩  to force start and  ❌  to end lobby.`
                },
                {
                "name": `Game Settings:`,
                "value": "Num. Rounds = " + global.game_settings.n_rounds + " \nRound Time = " + global.game_settings.round_time + "\nTitle max songs = " + global.game_settings.title_max_songs + "\nAnime = " + global.game_settings.anime + "\nGame = " + global.game_settings.game + "\nOther = " + global.game_settings.other + "\nInserts = " + global.game_settings.inserts + "\nWatched =  " + global.game_settings.watched + "\nGuess = " + global.game_settings.guess
                }
            ],
        };
        interaction.channel.send({ embeds: [gameEmbed] })
        .then(async function (message) {
            await message.react('👍');
            await message.react('⏩');
            await message.react('❌');

            const collectorFilter = (reaction, user) => {
                return (reaction.emoji.name === '👍' || reaction.emoji.name === '⏩' || reaction.emoji.name === '❌') && !user.bot;
            };
            
            const collector = message.createReactionCollector({ filter: collectorFilter, time: 30000, dispose: true });
            
            collector.on('collect', (reaction, user) => {
                if(reaction.emoji.name === '👍'){
                    player_ids.push({"id": user.id});
                }
                else if(reaction.emoji.name === '⏩' && user.id == interaction.member){
                    collector.stop('ForceStart');
                }
                else if(reaction.emoji.name === '❌' && user.id == interaction.member){
                    collector.stop("OwnerStop");
                }
            });
    
            collector.on('remove', (reaction, user) => {
                if(reaction.emoji.name === '👍'){
                    const idxObj = player_ids.findIndex(object => {
                        return object.id === user.id;
                    });
                      
                    player_ids.splice(idxObj, 1);
                }
            });
            
            collector.on('end', (collected, reason) => {
                if(reason && reason === "OwnerStop"){
                    clear_cmq_data();
                    return void interaction.channel.send({content: '❌ | Lobby owner ended the CMQ session.'});
                }

                if(player_ids.length !== 0){ 
                    cmq_master(interaction, player_ids);
                    
                    if(reason && reason === "ForceStart"){
                        return void interaction.channel.send({content: '⏩ | Lobby owner forced start.\n🎵 | CMQ will begin soon!'});
                    }

                    else {
                        return void interaction.channel.send({content: '🎵 | CMQ will begin soon!'});
                    }
                }
                else{
                    clear_cmq_data();
                    return void interaction.followUp({
                        content: "❌ | CMQ ended because there wasn't any players!",
                    });
                }
            });

        })
        .catch(error => {
            console.log(error);
            clear_cmq_data();
            return void interaction.followUp({
                content: '❌ | Something went wrong!',
            });
        });
    },
};


function get_game_settings(interaction){
    if(interaction.options.get('n_rounds') === null) n_rounds = 20;
    else{
        n_rounds = interaction.options.get('n_rounds').value;
        n_rounds = Math.max(1, n_rounds);
        n_rounds = Math.min(50, n_rounds);
    }

    if(interaction.options.get('round_time') === null) round_time = 30;
    else{
        round_time = interaction.options.get('round_time').value;
        round_time = Math.max(15, round_time);
        round_time = Math.min(60, round_time);
    }

    if(interaction.options.get('title_max_songs') === null) title_max_songs = 3;
    else{
        title_max_songs = interaction.options.get('title_max_songs').value;
        title_max_songs = Math.max(1, title_max_songs);
        title_max_songs = Math.min(100, title_max_songs);
    }

    if(interaction.options.get('anime') === null) anime = true;
    else anime = interaction.options.get('anime').value;

    if(interaction.options.get('game') === null) game = false;
    else game = interaction.options.get('game').value;

    if(interaction.options.get('other') === null) other = false;
    else other = interaction.options.get('other').value;

    if(interaction.options.get('inserts') === null) inserts = false;
    else inserts = interaction.options.get('inserts').value;

    if(interaction.options.get('watched') === null) watched = "union";
    else watched = interaction.options.get('watched').value;

    if(interaction.options.get('guess') === null) guess = "title";
    else guess = interaction.options.get('guess').value;

    return new CMQ_settings(n_rounds, round_time, title_max_songs, anime, game, other, inserts, watched, guess)
}
