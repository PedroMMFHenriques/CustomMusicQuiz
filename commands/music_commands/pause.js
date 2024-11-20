const {useQueue} = require("discord-player");
const {isInVoiceChannel} = require("../utils/voicechannel");

module.exports = {
    name: 'pause',
    description: 'Pause current song.',
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
        const success = queue.node.pause()
        return void interaction.followUp({
            content: success ? '⏸ | Paused!' : '❌ | Something went wrong!',
        });
    },
};
