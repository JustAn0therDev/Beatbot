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
        msg.channel.send(embedMessage);
    }
}