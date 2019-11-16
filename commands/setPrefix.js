module.exports = {
    name: 'setprefix',
    description: 'Sets a custom prefix for the current session.',
    async execute(msg, beatBot) {
        const args = msg.content.split(' ');
        if (!args[1]) {
            msg.reply('you must give me a prefix to set if you want to customize it!');
            return;
        } else {
            beatBot.prefix = args[1];
            msg.channel.send(`The prefix for this server has been set to "${beatBot.prefix}"`);
        }
    }
}