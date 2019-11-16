module.exports = { 
    name: 'ping',
    async execute(msg, beatBot) {
        await msg.reply(`pong! Latency: ${Math.round(beatBot.ping)}ms`);
    }
}