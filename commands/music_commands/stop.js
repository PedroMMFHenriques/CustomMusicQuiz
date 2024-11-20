const {useQueue} = require("discord-player");
const {isInVoiceChannel} = require("../utils/voicechannel");

module.exports = {
    name: 'stop',
    description: 'Stop all songs in the queue.',
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

        await interaction.deferReply();
        const queue = useQueue(interaction.guild.id)
        if (!queue || !queue.currentTrack)
            return void interaction.followUp({
                content: '❌ | No music is being played!',
            });
        queue.node.stop()
        if(useQueue(interaction.guild.id).connection)
            useQueue(interaction.guild.id).connection.disconnect()
        return void interaction.followUp({content: '🛑 | Stopped the player!'});
    },
};
