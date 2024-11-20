const {ApplicationCommandOptionType} = require('discord.js');
const {isInVoiceChannel} = require("../utils/voicechannel");

module.exports = {
    /*data: new SlashCommandBuilder()
		.setName('guess')
		.setDescription('Guess your answer for the CMQ round.')
		.addStringOption(option =>
			option.setName('input')
				.setDescription('Your answer.')
				.setAutocomplete(true)),
	async autocomplete(interaction) {
		const focusedValue = interaction.options.getFocused();
		const choices = ['Popular Topics: Threads', 'Sharding: Getting started', 'Library: Voice Connections', 'Interactions: Replying to slash commands', 'Popular Topics: Embed preview'];
		const filtered = choices.filter(choice => choice.startsWith(focusedValue));
		await interaction.respond(
			filtered.map(choice => ({ name: choice, value: choice })),
		);
	},*/
    name: 'guess',
    description: 'Guess your answer for the CMQ round.',
    options: [
        {
            name: 'input',
            description: 'Your answer.',
            required: true,
            type: ApplicationCommandOptionType.String,
            autocomplete: true,
        },
    ],
    async autocomplete(interaction){
        let choices;
            if(global.cmq_data.gameReady === false){
                choices = ["can't guess if there isn't a game!"];
            }
            else{
                choices = global.game_data.possible_answers;
            }
            
            const focusedOption = interaction.options.getFocused(true);
            const filtered = choices.filter(choice => choice.includes(focusedOption.value.toLowerCase()));

            let options;
            if(filtered.length > 25) options = filtered.slice(0, 25);
            else options = filtered;

            await interaction.respond(
                options.map(choice => ({name: choice, value: choice})),
            );
    },
    async execute(interaction) {
        await interaction.deferReply({ephemeral: true});

        const inVoiceChannel = isInVoiceChannel(interaction)
        if (!inVoiceChannel) {
            return
        }

        if(global.cmq_data.gameRunning === false){
            return void interaction.followUp({
                content: "There isn't a CMQ session running!",
                ephemeral: true,
            });
        }

        if(global.cmq_data.roundRunning === false){
            return void interaction.followUp({
                content: "You can't guess right now!",
                ephemeral: true,
            });
        }
        
        for(let i=0; i < global.player_data.length; i++){
            if(interaction.member.id === global.player_data[i].id){
                if(global.player_data[i].answered === false){
                    global.player_data[i].answered = true;
                    interaction.channel.send({content: "✅ | " + "<@" + interaction.member.id + "> has submitted their guess!\n", allowed_mentions: {users: []}});
                }
                global.player_data[i].answer = interaction.options.get('input').value.toLowerCase();
            }
        }

        return void interaction.followUp({
            content: "You guessed: **" + interaction.options.get('input').value +"**.",
            ephemeral: true,
        });
    },
};
