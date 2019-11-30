module.exports = { 
    name: 'ping',
    description: 'Shows the bot latency.',
    async execute(msg, beatBot) {
        await msg.reply(`pong! Latency: ${Math.round(beatBot.ping)}ms`);
    }
}