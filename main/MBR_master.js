const fs = require('fs');
const {sleep} = require("../commands/utils/sleep");
const {shuffle_array} = require("../commands/utils/shuffle_array");
const fetch = require('node-fetch');

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer ' + process.env.TMDB_TOKEN
  }
};

const movie_url_init = 'https://api.themoviedb.org/3/search/movie?query=';
const movie_url_end =  '&include_adult=true&language=en-US&page=1';

const credits_url_init = 'https://api.themoviedb.org/3/movie/';
const credits_url_end = '/credits?language=en-US';


class MBR_player{
    constructor(id, n_skips, n_casts, n_times) {
        this.id = id;
        this.n_skips = n_skips;
        this.n_casts = n_casts;
        this.n_times = n_times;
    }
    my_turn = false;
}

class MBR_movie{
    constructor(name, id, date, credit_list) {
        this.name = name; //name + date (title_add_year)
        this.id = id;
        this.credit_list = credit_list; // name, id, job (duplicates allowed)
    }
}

class person{
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }
    n_links = 0;
}


async function mbr_master(interaction, player_ids, starting_movie){
    await sleep(1000);

    console.log(player_ids)
    shuffle_array(player_ids)
    console.log("---------------------------------")
    console.log(player_ids)

    /* Create player classes */
    let player_order = []
    for (let i = 0; i < player_ids.length; i++) {
        global.player_data.push(new MBR_player(player_ids[i].id, global.game_settings.n_skips, global.game_settings.n_casts, global.game_settings.n_times));
        player_order.push({"name": "<@" + player_ids[i].id + ">"})
    }

    let movies_used = []
    movies_used.push({"name": title_add_year(starting_movie), "id": starting_movie.id})

    let links_used = [] //DON'T ALLOW DUPLICATES (don't save department, just name and id)

    /*search_list = search_movie_list(prompt)
    search_list.push({"label": "Choose this to cancel", "description": " ", "value": "cancel"});*/

    curr_movie = new MBR_movie(title_add_year(starting_movie), starting_movie.id, get_credits(starting_movie.id))

    const prepTime = getTimestampInSeconds() + 10
    const prepEmbed = {
        color: 0x0a4fbf,
        title: "Game starting " + prepTime + ", get ready!",
        description: "Player order will be:",
        fields: player_order,
    };
    await interaction.channel.send({ embeds: [prepEmbed] })

    round_num = 1;
    while(true){
        for (let i = 0; i < global.player_data.length; i++, round_num++) {
            curr_player = global.player_data[i];

            curr_player.my_turn = true;
            
            //trocar por slah commands: /pass /cast /time
            const roundTime = getTimestampInSeconds() + game_settings.round_time
            const roundEmbed = {
                color: 0x0a4fbf,
                title: curr_movie.name,
                description: "Round " + round_num,
                fields: [
                    {
                        "name": "Round ends <t: "+ roundTime + ":R>.",
                        "value": ""
                    },
                    {
                    "name": "Guess with /movie",
                    "value": "/pass left: " + curr_player.n_skips + "\n/cast left: " + curr_player.n_casts + "\n/time left: " + curr_player.n_times
                    },
                ],
            };

            for(let i=0; i < game_settings.round_time + 1; i++){
                await sleep(1000);
                if(skip_called) break;
            }

            /*
            await interaction.channel.send({ embeds: [roundEmbed] })
            .then(async function (message) {
                await message.react('⏩');
                await message.react('🧑');
                await message.react('⏰');

                const collectorFilter = (reaction, user) => {
                    console.log(user.id)
                    console.log(curr_player.id)
                    console.log(user.id == curr_player.id)
                    return (reaction.emoji.name === '⏩' || reaction.emoji.name === '🧑' || reaction.emoji.name === '⏰') && !user.bot && user.id === curr_player.id;
                };
                
                const collector = message.createReactionCollector({ filter: collectorFilter, time: game_settings.round_time * 1000, dispose: true});
                
                collector.on('collect', (reaction, user) => {
                    if(reaction.emoji.name === '⏩'){
                        if(curr_player.skips > 0){
                            curr_player.skips--;
                            collector.stop("Skip");
                        }
                        else{
                            interaction.channel.send({content: "❌ | You don't have passes left!"});
                        }
                          
                    }
                    else if(reaction.emoji.name === '🧑'){
                        if(curr_player.casts > 0){
                            curr_player.casts--;
                            print_cast(interaction, curr_movie)
                        }
                        else{
                            interaction.channel.send({content: "❌ | You don't have casts left!"});
                        }
                    }
                    else if(reaction.emoji.name === '⏰'){
                        if(curr_player.times > 0){
                            curr_player.times--;
                            collector.stop("Time"); //Remover todos reacts + criar um novo collector num embed só com o novo tempo e  reactsó com skip e casts + RESET TIMER
                        }
                        else{
                            interaction.channel.send({content: "❌ | You don't have times left!"});
                        }
                    }
                });
        
                
                collector.on('end', (collected, reason) => {
                    if(reason && reason === "Skip"){
                        interaction.channel.send({content: '⏩ | Used pass!'});
                    }
                    else if(reason && reason === "Time"){
                        message.reactions.removeAll()
	                        .catch(error => console.error('Failed to clear reactions:', error));

                        //interaction.channel.send({content: '⏩ | Skipping to next round...'});
                    }
                    else{
                        // round finished normally aka player timedout and lost
                    }
                });

            })
            .catch(error => {
                console.log(error);
                interaction.followUp({
                    content: '❌ | Something went wrong!',
                });
            });*/


        }
    }
    // MENU SELECTION: INSTANT PROCEED DPS DE ESCOLHER A 1ª OPÇÃO OU CANCELAR
    // -------------------------------------------------------------------------------------------
    global.game_data = new CMQ_game(queue, possible_answers);
    for (let i = 0; i < player_ids.length; i++) {
        global.game_data.score.push({"id": player_ids[i].id, "score": 0});
    }

    global.cmq_data.gameReady = true;
    let vote_skips = 0;
    let skip_called = false;
    let end_called = false;
    /* Round Loop */
    for(let curr_song = 0; curr_song < game_settings.n_rounds; curr_song++){
        /* Reset player's round data */
        for(let i=0; i < global.player_data.length; i++){
            global.player_data[i].answer = "";
            global.player_data[i].answered = false;
            vote_skips = 0;
            skip_called = false;
        }

        const song_link = global.game_data.queue[curr_song].link;
        const searchQuery = global.game_data.queue[curr_song].titles[0] + " " + global.game_data.queue[curr_song].song + " " + global.game_data.queue[curr_song].artist
        /* const timestamp = await get_timestamp(song_link); */

        //await sleep(4000);
        try {
            const res = await music_player.play(interaction.member.voice.channel.id, song_link, {
                nodeOptions: {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild?.members.me,
                        requestedBy: interaction.user.username
                    },
                    
                    leaveOnEmpty: false,
                    leaveOnEnd: false,
                    leaveOnStop: false,
                    bufferingTimeout: 0,
                    volume: 10,
                    //defaultFFmpegFilters: ['lofi', 'bassboost', 'normalizer']
                },
                audioPlayerOptions: {
                    seek: timestamp
                }
            });
        } catch (error) {
            console.log(error);
            interaction.channel.send({content: "❗ | Link broken, trying YT search (song may be wrong)."});
            try {
                const res = await music_player.play(interaction.member.voice.channel.id, searchQuery, {
                    nodeOptions: {
                        metadata: {
                            channel: interaction.channel,
                            client: interaction.guild?.members.me,
                            requestedBy: interaction.user.username
                        },
                        
                        leaveOnEmpty: false,
                        leaveOnEnd: false,
                        leaveOnStop: false,
                        bufferingTimeout: 0,
                        volume: 10,
                        //defaultFFmpegFilters: ['lofi', 'bassboost', 'normalizer']
                        defaultFFmpegFilters: ['normalizer']
                    },
                    audioPlayerOptions: {
                        seek: timestamp
                    },
                    searchEngine: "youtube"
                });
            } catch (error) {
                console.log(error);
                interaction.channel.send({content: "❌ | Music player failed to find music, skipping round."});
                continue
            }
        }

        const roundTime = getTimestampInSeconds() + game_settings.round_time
        const startEmbed = {
            color: 0x19c12d,
            title: "Starting round " + (curr_song+1) + ", get ready!",
            description: "",
            fields: [
                {
                "name": `React with  ⏩  to vote skip.`,
                "value": `Lobby owner can  ❌  to end game.`,
                },
                {
                "name": `Round ends <t:` + roundTime + `:R>.`,
                "value": ``
                }
            ],
        };
        

        await interaction.channel.send({ embeds: [startEmbed] })
        .then(async function (message) {
            await message.react('⏩');
            await message.react('❌');

            const collectorFilter = (reaction, user) => {
                return (reaction.emoji.name === '⏩' || reaction.emoji.name === '❌') && !user.bot;
            };
            
            const collector = message.createReactionCollector({ filter: collectorFilter, time: game_settings.round_time * 1000, dispose: true});
            
            collector.on('collect', (reaction, user) => {
                if(reaction.emoji.name === '⏩'){
                    vote_skips += 1;
                    let everyone_answered = true;
                    if(vote_skips > global.player_data.length/2){
                        /* Check if everyone answered */
                        for(let i=0; i < global.player_data.length; i++){
                            if(global.player_data[i].answered === false){
                                everyone_answered = false;
                                break;
                            }
                        }
                        if(everyone_answered === true){
                            skip_called = true;
                            collector.stop("VoteSkip");
                        }
                            
                    }
                }
                else if(reaction.emoji.name === '❌' && user.id == interaction.member){
                    interaction.channel.send({content: '❌ | Game will end early unless lobby owner removes the react!'});
                    end_called = true;
                }
            });
    
            collector.on('remove', (reaction, user) => {
                if(reaction.emoji.name === '⏩'){
                    vote_skips -= 1;
                }
                else if(reaction.emoji.name === '❌' && user.id == interaction.member){
                    interaction.channel.send({content: '✅ | Game will not end early.'});
                    end_called = true;
                }
            });
            
            collector.on('end', (collected, reason) => {
                if(reason && reason === "OwnerEnd"){
                    interaction.channel.send({content: '❌ | Game ended early by lobby owner!'});
                }
                else if(reason && reason === "VoteSkip"){
                    interaction.channel.send({content: '⏩ | Skipping to next round...'});
                }
                else{
                    /* round finished normally */
                }
            });

        })
        .catch(error => {
            console.log(error);
            interaction.followUp({
                content: '❌ | Something went wrong!',
            });
        });

        global.cmq_data.roundRunning = true; /* Enable /guess e /voteskip */

        /* cheating! */
        /*console.log(global.game_data.queue[curr_song].titles[0]); 
        console.log(global.game_data.queue[curr_song].song);
        console.log(global.game_data.queue[curr_song].artist);*/

        /* wait round time */
        for(let i=0; i < game_settings.round_time + 1; i++){
            await sleep(1000);
            if(skip_called) break;
        }

        /* Round ended! */
        global.cmq_data.roundRunning = false;

        /* Get who is correct and update score so far.*/
        let correct_guess;
        if(global.game_settings.guess === "title"){
            correct_guess = []
            for(let i=0; i < global.game_data.queue[curr_song].titles.length; i++){
                correct_guess.push(global.game_data.queue[curr_song].titles[i].toLowerCase());
            }
        }
        else if(global.game_settings.guess === "song") 
            correct_guess = global.game_data.queue[curr_song].song.toLowerCase();
        else /* artist */ 
            correct_guess = global.game_data.queue[curr_song].artist.toLowerCase();

        let correct_players = "";
        let your_guesses = "";
        for(let i=0; i < global.player_data.length; i++){
            let player_answer = (element) => element === global.player_data[i].answer;
            if(global.game_settings.guess === "title" && correct_guess.some(player_answer)){
                correct_players = correct_players + "<@" + global.player_data[i].id + ">\n";
                let idxObj = global.game_data.score.findIndex(object => {return object.id === global.player_data[i].id;});
                global.game_data.score[idxObj].score += 1;
                global.player_data[i].score += 1;
            }
            else if(correct_guess === global.player_data[i].answer){
                correct_players = correct_players + "<@" + global.player_data[i].id + ">\n";
                let idxObj = global.game_data.score.findIndex(object => {return object.id === global.player_data[i].id;});
                global.game_data.score[idxObj].score += 1;
                global.player_data[i].score += 1;
            }
            your_guesses = your_guesses + "<@" + global.player_data[i].id + ">: " + global.player_data[i].answer + "\n";
        }
        if(correct_players === "") correct_players = "Nobody!"

        let sorted_score = global.game_data.score.sort((a, b) => {return b.score - a.score;});
        let curr_score = "";
        for(let i=0; i < sorted_score.length; i++){
            curr_score = curr_score + "<@" + sorted_score[i].id + ">: " + sorted_score[i].score + "\n";
        }

        let correct_guess_str;
        let other_info_str;
        if(global.game_settings.guess === "title"){
            correct_guess_str = global.game_data.queue[curr_song].titles[0];
            other_info_str = "Song: " + global.game_data.queue[curr_song].song + "\nArtist: " + global.game_data.queue[curr_song].artist + "\n";
        }
        else if(global.game_settings.guess === "song"){
            correct_guess_str = global.game_data.queue[curr_song].song;
            other_info_str = "Title: " + global.game_data.queue[curr_song].titles[0] + "\nArtist: " + global.game_data.queue[curr_song].artist + "\n";
        }
        else{ /* artist */
            correct_guess_str = global.game_data.queue[curr_song].artist;
            other_info_str = "Title: " + global.game_data.queue[curr_song].titles[0] + "\nSong: " + global.game_data.queue[curr_song].song + "\n";
        }

        /* Show who is correct and scores so far.*/
        const roundEmbed = {
            color: 0x19c12d,
            title: "Round " + (curr_song + 1) + " ended!",
            description: "The correct answer was: **" + correct_guess_str + "**\n" + other_info_str,
            fields: [
                {
                    "name": `Who got it correct:`,
                    "value": correct_players
                },
                {
                    "name": `Your guesses:`,
                    "value": your_guesses
                },
                {
                    "name": `Current score:`,
                    "value": curr_score
                }
            ],
        };
        interaction.channel.send({embeds: [roundEmbed]})

        await sleep(10000);
        useQueue(interaction.guild.id).node.stop();

        if(end_called){
            interaction.channel.send({content: '❌ | Lobby owner ended the game early!'});
            break;
        }
    }

    /* Game ended! */
    await sleep(1000); 

    /* Get players place. */
    const players_place = [...global.player_data].sort((a, b) => b.score - a.score);

    players_place.reduce((padded, player, i) => {
        const score = player.score;
        const prevScore = padded[i].score;
        const nextScore = padded[i + 2].score;

        player.isTied = score === prevScore || score === nextScore;
        player.place = score === prevScore ? padded[i].place : i + 1;

        return padded;
    }, [{ score: null }, ...players_place, { score: null }]);

    let final_score = "";
    let winners = "";
    let n_winners = 0;
    let points_str = "";
    /* Add points and score. */
    for(let i=0; i < players_place.length; i++){
        let user_idx = global.player_stats.users.findIndex(object => {return object.id === players_place[i].id;});
        if(players_place[i].place === 1){
            winners = winners + "<@" + players_place[i].id + ">\n";
            n_winners += 1;
            global.player_stats.users[user_idx].games_won += 1;
        }
        global.player_stats.users[user_idx].games_played += 1;
        global.player_stats.users[user_idx].rounds_won += players_place[i].score;
        let points_increase = ((players_place.length - players_place[i].place)*0.1 + 1)*players_place[i].score + 1;
        global.player_stats.users[user_idx].points += points_increase;
        points_str = points_str + "<@" + players_place[i].id + ">: " + points_increase.toFixed(2) + "\n";
        final_score = final_score + "<@" + players_place[i].id + ">: " + players_place[i].score + "\n";
    }

    /* Update user info file. */
    json = JSON.stringify(global.player_stats);
    await sleep(1000);
    fs.writeFile('data/user_info.json', json, (err) => {
        if (err) throw err;
        console.log('Scores have been saved!');
    }); 
    await sleep(1000);
    global.player_stats = JSON.parse(fs.readFileSync('data/user_info.json'));

    /* Show final game scores. */
    let prev_winners = "";
    if(n_winners === 1) prev_winners = "The winner is: "
    else prev_winners = "The winners are:\n"
    const endEmbed = {
        color: 0x19c12d,
        title: "Game ended!",
        description: prev_winners + winners,
        fields: [
            {
                "name": `Final score:`,
                "value": final_score
            },
            {
                "name": `Points added:`,
                "value": points_str
            },
        ],
    };
    interaction.channel.send({embeds: [endEmbed]})

    if(useQueue(interaction.guild.id).connection)
        useQueue(interaction.guild.id).connection.disconnect()

    await sleep(1000);
    
    global.player_data = [];
    global.cmq_game = []
    clear_cmq_data();
}


/* ///////////////////////////////////////////////////////////////////////////////////////////////////////// */
/* UTILS */
async function search_movie_list(prompt){
    const url = movie_url_init + String(prompt).split(' ').join('%20') + movie_url_end;
    const res = await fetch(url, options);
    const json_res = await res.json();

    let search_list = []
    for(let i = 0; i < Math.min(json_res.total_results, 20); i++){
        search_list.push({"label": title_add_year(json_res.results[i]), "description": " ", "value": String(json_res.results[i].id)});
    }

    return search_list
}

async function get_credits(movie_id){
    const url = credits_url_end + String(movie_id) + credits_url_end;
    const res = await fetch(url, options);
    const json_res = await res.json();

    let credit_list = []
    for(let i = 0; i < json_res.results.length; i++){
        if(json_res.results[i].job === "Director") credit_list.push({"name": json_res.results[i].name, "id": json_res.results[i].id, "job": "Directing"});
        if(json_res.results[i].department === "Writing") credit_list.push({"name": json_res.results[i].name, "id": json_res.results[i].id, "job": "Writing"});
        console.log(json_res.results[i].character)
        if(json_res.results[i].character != null) credit_list.push({"name": json_res.results[i].name, "id": json_res.results[i].id, "job": "Acting"});
    }

    return credit_list
}

//REMOVE DUPLICATE CREDITS (AVOID Nolanverse)
function removeDuplicateSongTitles(objectsList, max, guess) {
    const counts = {};
    const uniqueObjectsList = [];
  
    objectsList.forEach((obj) => {
        let title;
        if(guess === "title")
            title = obj.titles[0];
        else
            title = obj[guess];
        counts[title] = (counts[title] || 0) + 1;
        
        if (counts[title] <= max)
            uniqueObjectsList.push(obj);
    });
  
    return uniqueObjectsList;
}

function print_cast(interaction, curr_movie){
    let directing_list = ""
    let writing_list = ""
    let acting_list = ""

    let credit_list = curr_movie.credit_list

    for(let i = 0; i < credit_list.length; i++){
        if(credit_list[i].job === "Directing"){
            if(directing_list === "") directing_list = credit_list[i].name
            else directing_list = directing_list + ", " + credit_list[i].name
        }
        else if(credit_list[i].job === "Writing"){
            if(writing_list === "") writing_list = credit_list[i].name
            else writing_list = writing_list + ", " + credit_list[i].name
        }
        else if(credit_list[i].job === "Acting"){
            if(acting_list === "") acting_list = credit_list[i].name
            else acting_list = acting_list + ", " + credit_list[i].name
        }
    }

    const castsEmbed = {
        color: 0x0a4fbf,
        title: curr_movie.name + " cast:",
        description: "",
        fields: [
            {
                "name": "Directing:",
                "value": directing_list
            },
            {
                "name": "Writing:",
                "value": writing_list
            },
            {
                "name": "Acting:",
                "value": acting_list
            },
        ],
    };
    interaction.channel.send({embeds: [castsEmbed]})
}


// VAI TER Q SER NO /GUESS_MOVIE.PY
async function choose_movie(interaction, search_list){
    const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(interaction.id)
    .setPlaceholder("Confirm starting movie...")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
        search_list.map((movie) => 
            new StringSelectMenuOptionBuilder()
                .setLabel(movie.label)
                .setDescription(movie.description)
                .setValue(movie.value)
        )
    );
    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    
    movie_index = ""
    timeout = 15000
    interaction.reply({components: [actionRow], ephemeral: true})
    .then(async function (reply) {
        const collector = reply.createMessageComponentCollector({
            ComponentType: ComponentType.StringSelect,
            filter: (i) => i.user.id === interaction.user.id && i.customId === interaction.id,
            time: timeout,
        })

        collector.on("collect", (interaction) => {
            //interaction.reply({content: "Selected: " + interaction.values.join(', '), ephemeral: true})
            if(interaction.values == "cancel") interaction.reply({content: "The game will abort soon.", ephemeral: true})
            else interaction.reply({content: "Updated selection!", ephemeral: true})
            movie_index = interaction.values
        })
    
    })

    await sleep(timeout + 1000);

    if(movie_index == ""){
        interaction.followUp({content: "Timed out! Aborting game...", ephemeral: true})
        global.mbr_data.gameRunning = false;
    } 
    else if(movie_index == "cancel") {
        interaction.followUp({content: "Aborting game...", ephemeral: true})
        global.mbr_data.gameRunning = false;
    }
    else{
        interaction.followUp({content: "Starting MBR with you as the lobby owner.", ephemeral: true})
    }
}

function title_add_year(movie){
    release_year = movie.release_date.split("-")[0];
    if(release_year != "") title_year = movie.title + " (" + release_year + ")";
    else title_year = movie.title;
    
    return title_year
}

function clear_mbr_data(){
    global.gameRunning = false;
    global.gameReady = false;
}

function getTimestampInSeconds() {
    return Math.floor(Date.now() / 1000)
}

exports.mbr_master = mbr_master;
exports.clear_mbr_data = clear_mbr_data;