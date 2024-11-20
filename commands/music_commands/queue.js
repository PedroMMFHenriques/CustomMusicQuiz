const {useQueue} = require("discord-player");
const {isInVoiceChannel} = require("../utils/voicechannel");

module.exports = {
    name: 'queue',
    description: 'View the queue of current songs.',
    async execute(interaction) {
        const inVoiceChannel = isInVoiceChannel(interaction)
        if (!inVoiceChannel) {
            return
        }

        if(global.cmq_data.gameRunning === true){
            interaction.reply({
                content: 'A CMQ session is currently running!',
                ephemeral: true,
            });
            return
        }

        const queue = useQueue(interaction.guild.id)
        if (queue && queue.currentTrack) {
            const trimString = (str, max) => ((str.length > max) ? `${str.slice(0, max - 3)}...` : str);
            return void interaction.reply({
                embeds: [
                    {
                        title: 'Now Playing',
                        description: trimString(`The Current song playing is 🎶 | **${queue.currentTrack.title}**! \n 🎶 | ${queue}! `, 4095),
                    }
                ]
            })
        } else {
            return void interaction.reply({
                content: '❌ | There is no song in the queue!'
            })
        }
    }
}
