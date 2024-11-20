const {useMainPlayer, useQueue} = require('discord-player');
const fs = require('fs');

const {sleep} = require("../commands/utils/sleep");
const {shuffle_array} = require("../commands/utils/shuffle_array");
const {rng_int_range} = require("../commands/utils/rng_int_range");

class CMQ_player{
    constructor(id) {
        this.id = id;
    }
    score = 0;
    answer = "";
    answered = false;
}

class CMQ_game{
    constructor(queue, possible_answers) {
        this.queue = queue; /* list of songs that will be tested */
        this.possible_answers = possible_answers; /* list of songs in the filter*/
    }
    score = []
}

class CMQ_song{
    /* used to play song (link) */
    constructor(link, titles, song, artist) {
        this.link = link;
        this.titles = titles; /* may be a list */
        this.song = song;
        this.artist = artist;
    }
}


async function cmq_master(interaction, player_ids){
    await sleep(1000);

    const music_player = useMainPlayer();

    /* Create player classes */
    for (let i = 0; i < player_ids.length; i++) {
        global.player_data.push(new CMQ_player(player_ids[i].id));
    }

    /* Check for CMQ filters and retrieve songs */
    const [queue, possible_answers] = get_songs(global.game_settings, global.player_data); 

    if(queue.length === 0){
        interaction.channel.send({content: "❌ | Filters were too restrictive, no music is valid!\n❌ | Game failed to start!"})
        global.player_data = [];
        global.cmq_game = []
        clear_cmq_data();
        return
    }
    else if(queue.length < global.game_settings.n_rounds){
        interaction.channel.send({content: "❗ | Filters were too restrictive, reduced number of rounds!"})
        global.game_settings.n_rounds = queue.length;
    }

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
        const timestamp = rng_int_range(0, 40)*1000;
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
async function get_timestamp(link){
    const temp_file = 'data/temp/temp.mp3'
    let error = false;

    await fetchWithTimeout(link,{timeout: 8000}).then(res => res.buffer()).then(buffer => {
        return fs.writeFileSync(temp_file, buffer);
    }).catch(err => {
        error = true;
        return console.log("[Err] Fetch Error");
    })
    if(error) return 0

    const getMP3Duration = require('get-mp3-duration');
    const buffer = fs.readFileSync(temp_file);
    const duration = getMP3Duration(buffer);

    fs.unlink(temp_file, (err) => {
        if (err){console.log(err)}; //handle your error the way you want to;
    });
        
    if(duration < (global.game_settings.round_time + 10) * 1000) return 0
    else{
        const max_timestamp = (duration - (global.game_settings.round_time + 10) * 1000);
        const timestamp = rng_int_range(0, max_timestamp);
        return timestamp
    }
}

function get_songs(settings, player_data){
    /* Get watched list. */
    let watched_list = [];
    if(settings.watched !== "all"){
        for(let i = 0; i < player_data.length; i++){
            const user_idx = global.player_stats.users.findIndex(object => {return object.id.toString() === player_data[i].id.toString();});
            if(settings.anime === true)
                for(let j = 0; j < global.player_stats.users[user_idx].anime.length; j++) watched_list.push(global.player_stats.users[user_idx].anime[j].toLowerCase())
            if(settings.game === true)
                for(let j = 0; j < global.player_stats.users[user_idx].game.length; j++) watched_list.push(global.player_stats.users[user_idx].game[j].toLowerCase())
            if(settings.other === true)
                for(let j = 0; j < global.player_stats.users[user_idx].other.length; j++) watched_list.push(global.player_stats.users[user_idx].other[j].toLowerCase())
        }
        
        /* If intersection of watched_list, remove non-dups. */
        if(settings.watched === "intersection"){ 
            var map = new Map();
            watched_list.forEach(a => map.set(a, (map.get(a) || 0) + 1));
            watched_list = watched_list.filter(a => map.get(a) > 1);
        }

        watched_list = watched_list.filter((item,index) => watched_list.indexOf(item) === index);
    }

    /* Create song list. */
    const all_songs_file = fs.readFileSync('data/all_songs.json');
    const song_list = [];
    if(settings.anime === true){
        const all_animes = JSON.parse(all_songs_file).animes;        

        if(settings.inserts === true){
            for(let i = 0; i < all_animes.length; i++){
                if(all_animes[i].audio !== null){
                    if(settings.watched !== "all"){
                        let in_watched_EN = (element) => element === all_animes[i].animeENName.toLowerCase();
                        let in_watched_JP = (element) => element === all_animes[i].animeJPName.toLowerCase();
                        if(watched_list.some(in_watched_EN)) 
                            song_list.push(format_anime_song(all_animes[i]));
                        else if(watched_list.some(in_watched_JP))
                            song_list.push(format_anime_song(all_animes[i]));     
                    }
                    else song_list.push(format_anime_song(all_animes[i]));
                }
            }
        }
        else{ /* skip inserts */
            for(let i = 0; i < all_animes.length; i++){
                if(all_animes[i].audio !== null && all_animes[i].songType !== "Insert Song"){
                    if(settings.watched !== "all"){
                        let in_watched = (element) => element === all_animes[i].animeENName.toLowerCase();
                        if(watched_list.some(in_watched)) 
                            song_list.push(format_anime_song(all_animes[i]));
                    }
                    else song_list.push(format_anime_song(all_animes[i]));
                }
            }
        }
    }

    if(settings.game === true){
        const all_games = JSON.parse(all_songs_file).games;
        for(let i = 0; i < all_games.length; i++){
            if(settings.watched !== "all"){
                let in_watched_EN = (element) => element === all_games[i].gameENName.toLowerCase();
                if(watched_list.some(in_watched_EN)) 
                    song_list.push(format_game_song(all_games[i]));
            }
            else song_list.push(format_game_song(all_games[i]));
        }
    }

    if(settings.other === true){
        /* Needs watched treatment as the games + format function */
        const all_other = JSON.parse(all_songs_file).others;

        for(let i = 0; i < all_other.length; i++){
            song_list.push(all_other[i]);
        }
    }

    /* get list of answers */
    const possible_answers = []
    for(let i = 0; i < song_list.length; i++){
        if(global.game_settings.guess === "title"){
            for(let j = 0; j < song_list[i].titles.length; j++)
                possible_answers.push(song_list[i].titles[j].toLowerCase());
        }
        else if(global.game_settings.guess === "song") possible_answers.push(song_list[i].song.toLowerCase());
        else if(global.game_settings.guess === "artist") possible_answers.push(song_list[i].artist.toLowerCase());
    }
    const possible_nonDup = possible_answers.filter((item,index) => possible_answers.indexOf(item) === index);


    
    /* Remove titles that show up more than global.settings.title_max_songs */
    const random_song_list = shuffle_array(song_list);
    const lessDup_song_list = removeDuplicateSongTitles(random_song_list, global.game_settings.title_max_songs, global.game_settings.guess);
    const random_lessDup_song_list = shuffle_array(lessDup_song_list);
    const queue = random_lessDup_song_list.slice(0, settings.n_rounds);

    return [queue, possible_nonDup]
}


function format_anime_song(anime_song){
    const link = anime_song.audio;
    const song = anime_song.songName;
    const artist = anime_song.songArtist;

    const titles = [];
    titles.push(anime_song.animeENName);
    if(anime_song.animeJPName !== null && anime_song.animeENName !== anime_song.animeJPName) titles.push(anime_song.animeJPName);
    if(anime_song.animeAltName !== null){
        for(let i = 0; i < anime_song.animeAltName.length; i++){
            titles.push(anime_song.animeAltName[i]);
        }
    }
    return new CMQ_song(link, titles, song, artist)
}

function format_game_song(game_song){
    const link = game_song.audio;
    const song = game_song.songName;
    const artist = game_song.songArtist;

    const titles = [];
    titles.push(game_song.gameENName);
    if(game_song.gameAltName !== null){
        for(let i = 0; i < game_song.gameAltName.length; i++){
            titles.push(game_song.gameAltName[i]);
        }
    }
    return new CMQ_song(link, titles, song, artist)
}


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


async function fetchWithTimeout(resource, options = {}) {
    const fetch = require('node-fetch');
    const { timeout = 3000 } = options;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
    });
    clearTimeout(id);

    return response;
}


function clear_cmq_data(){
    global.cmq_data.voice_chat = 0;
    global.cmq_data.gameRunning = false;
    global.cmq_data.roundRunning = false;
    global.cmq_data.gameReady = false;
    global.cmq_data.endCalled = false;
}

function getTimestampInSeconds() {
    return Math.floor(Date.now() / 1000)
}

exports.cmq_master = cmq_master;
exports.clear_cmq_data = clear_cmq_data;