const Discord = require('discord.js');

module.exports = {
    name: 'help',
    description: 'Help command. Pretty self-explanatory.',
    async execute(msg, commands, prefix) {
        let embedMessage = new Discord.RichEmbed()
        .setColor('#10B631')
        .setTitle('These are the available commands')
        .setDescription(`Take a look at the commands. You can invoke one of them by using the prefix "${prefix}"!`);
        for (let i = 0; i < commands.length; i++) {
            if (commands[i].name !== undefined)
                embedMessage.addField(`Name: ${commands[i].name} \nDescription: ${commands[i].description} \n`, "----------------");
        }
        embedMessage.addField('Name: play \nDescription: Plays a youtube video on the channel. It accepts the link for the video or a search query!', "----------------")
        .addField('Name: skip \nDescription: Skips the currently playing video on the queue.', "----------------")
        .addField('Name: pause \nDescription: Pauses the currently playing video.', "----------------")
        .addField('Name: resume \nDescription: Resumes the video that has been paused.', "----------------")
        .addField('Name: stop \nDescription: Stops playing the youtube video on the channel and clears the whole pending queue.', "----------------")
        .addField('Name: nowplaying \nDescription: Shows the currently playing video title.', "----------------")
        .addField('Name: queue \nDescription: Shows the queue of pending videos.', "----------------")
        .addField('Name: repeat \nDescription: Repeats the currently playing video. Use it again to deactivate it.', "----------------")
        msg.channel.send(embedMessage);
    }
}