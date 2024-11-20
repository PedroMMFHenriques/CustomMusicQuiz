require('dotenv').config()

class CMQ{
    voice_chat = 0;
    gameRunning = false;
    roundRunning = false;
    gameReady = false;
}

class MBR{
    gameRunning = false;
    gameReady = false;
    nextMovie = [];
}

const fs = require('fs');
const Discord = require('discord.js');
const {GatewayIntentBits, Partials} = require('discord.js');
const config = require('./config.json');
const {Player} = require('discord-player');
const {AttachmentExtractor} = require('@discord-player/extractor')

const {clear_cmq_data} = require("./main/CMQ_master");

global.cmq_data = new CMQ()
global.mbr_data = new MBR()

global.game_data = []

global.player_data = []

global.listen_channels = []

global.player_stats = JSON.parse(fs.readFileSync('data/user_info.json'));

const client = new Discord.Client({
    /*allowedMentions: {parse: ['users', 'roles', 'everyone']},*/
    allowedMentions: {parse: ['roles']},
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.MessageContent],
	partials: [Partials.User, Partials.GuildMember, Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Discord.Collection();

const musicCommandFiles = fs.readdirSync('./commands/music_commands').filter(file => file.endsWith('.js'));
for (const file of musicCommandFiles) {
    const command = require(`./commands/music_commands/${file}`);
    client.commands.set(command.name, command);
}

const cmqCommandFiles = fs.readdirSync('./commands/CMQ_commands').filter(file => file.endsWith('.js'));
for (const file of cmqCommandFiles) {
    const command = require(`./commands/CMQ_commands/${file}`);
    client.commands.set(command.name, command);
}

/*
const mbrCommandFiles = fs.readdirSync('./commands/MBR_commands').filter(file => file.endsWith('.js'));
for (const file of mbrCommandFiles) {
    const command = require(`./commands/MBR_commands/${file}`);
    client.commands.set(command.name, command);
}
*/

/* console.log(client.commands); */

const player = new Player(client);


player.extractors.loadDefault().then(r => console.log('Extractors loaded successfully'))
/* player.extractors.register(AttachmentExtractor, {}).then(r => console.log('Extractors loaded successfully')) */


player.events.on('audioTrackAdd', (queue, song) => {
    if(global.cmq_data.gameRunning === false){
        queue.metadata.channel.send(`🎶 | Song **${song.title}** added to the queue!`);
    }
});

player.events.on('playerStart', (queue, track) => {
    if(global.cmq_data.gameRunning === false){
        queue.metadata.channel.send(`▶ | Started playing: **${track.title}**!`);
    }
});

player.events.on('audioTracksAdd', (queue, track) => {
    if(global.cmq_data.gameRunning === false){
        queue.metadata.channel.send(`🎶 | Tracks have been queued!`);
    }
});

player.events.on('disconnect', queue => {
    if(global.cmq_data.gameRunning === false){
        queue.metadata.channel.send('❌ | Disconnecting from the voice channel...');
    }
});

player.events.on('emptyChannel', queue => {
    if(global.cmq_data.gameRunning === false){
        queue.metadata.channel.send('❌ | Nobody is in the voice channel, leaving...');
    }
});

player.events.on('emptyQueue', queue => {
    if(global.cmq_data.gameRunning === false){
        queue.metadata.channel.send('✅ | Queue finished!');
    }
});

player.events.on('error', (queue, error) => {
    console.log(`[${queue.guild.name}] Error emitted from the connection: ${error.message}`);
});

// For debugging
/*player.on('debug', async (message) => {
    console.log(`General player debug event: ${message}`);
});

player.events.on('debug', async (queue, message) => {
    console.log(`Player debug event: ${message}`);
});

player.events.on('playerError', (queue, error) => {
    console.log(`Player error event: ${error.message}`);
    console.log(error);
});*/

client.on('ready', function () {
    console.log('Ready!');

    const server_data = fs.readFileSync('data/server_info.json');
    global.listen_channels = JSON.parse(server_data).listen_channels;
    global.cmq_role = JSON.parse(server_data).cmq_role;
    
    client.user.presence.set({
        activities: [{name: config.activity, type: Number(config.activityType)}],
        status: Discord.Status.Ready
    })

});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('messageCreate', async message => {
    if (message.author.bot || !message.guild) return;

    /* Check if text_channel is whitelisted */
    if(global.listen_channels.find((element) => element === message.channel.id.toString()) === undefined){
        return;
    }

    if (!client.application?.owner) await client.application?.fetch();

    if (message.content === '!deploy' && message.author.id === client.application?.owner?.id) {
        /* check if any new member joined and needs to create structure */
        message.guild.members.fetch({ withPresences: true }).then(guild_members => {
            const current_member_list = [];
            for(let i = 0; i < Array.from(guild_members).length; i++){
                current_member_list.push(Array.from(guild_members)[i][0])
            }

            const member_data = fs.readFileSync('data/user_info.json');
            const old_member_list = JSON.parse(member_data).users;
            var updated_member_list = JSON.parse(member_data);
            for(let i = 0; i < current_member_list.length; i++){
                var new_member = true;
                for(let j = 0; j < old_member_list.length; j++){
                    if(current_member_list[i] === old_member_list[j].id){
                        new_member = false;
                        break;
                    }
                }
                /* If it doesnt find the member in the old list, add them */
                if(new_member === true){
                    console.log('New member!');
                    updated_member_list.users.push(
                        {
                            "id": current_member_list[i],
                            "rounds_won": 0,
                            "points": 0,
                            "games_won": 0,
                            "games_played": 0,
                            "anime": [],
                            "game": [],
                            "other": []
                        }
                    );
                }
            }
            json = JSON.stringify(updated_member_list);
            fs.writeFile('data/user_info.json', json, (err) => {
                if (err) throw err;
                console.log('Player data has been saved!');
            }); 
        });
        global.player_stats = JSON.parse(fs.readFileSync('data/user_info.json'));
        
        await message.guild.commands
            .set(client.commands)
            .then(() => {
                message.reply('Deployed!');
            })
            .catch(err => {
                message.reply('Could not deploy commands! Make sure the bot has the application.commands permission!');
                console.error(err);
            });
    }
});

client.on('interactionCreate', async interaction => {
    /*if (!interaction.isChatInputCommand()) return;*/
    if(interaction.commandName === undefined) return;

    /* Check if text_channel is whitelisted */
    if(global.listen_channels.find((element) => element === interaction.channel.id.toString()) === undefined){
        return void interaction.reply({
            content: "I can't speak on this channel!",
            ephemeral: true,
        });
    }
    const command = client.commands.get(interaction.commandName.toLowerCase());
    try {
        if (interaction.commandName === 'guess' && interaction.isAutocomplete()) {
            await command.autocomplete(interaction);
            
        } else {
            await command.execute(interaction);
        }
    } catch (error) {
        console.error("[ERR] Autocomplete error.");
    }
});

client.login(process.env.DISCORD_TOKEN);
