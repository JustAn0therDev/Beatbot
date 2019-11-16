module.exports = {
    name: 'help',
    description: 'Help command. Pretty self-explanatory.',
    async execute(msg, commands) {
        for (let i = 0; i < commands.length; i++) {
            await msg.channel.send(`Name: ${commands[i].name} \nDescription: ${commands[i].description} \n`);   
        }
    }
}