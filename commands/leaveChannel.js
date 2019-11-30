module.exports = {
    name: 'leave',
    description: 'Leaves the currently connected voice channel.',
    async execute(msg) {
        if (msg.guild.voiceConnection) {
          await msg.guild.voiceConnection.channel.leave();
            msg.reply('leaving channel!');
         } else {
             msg.reply('I must be in a voice channel to leave!');  
         }
    }
}