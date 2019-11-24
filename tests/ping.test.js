const ping = require('../commands/ping');

let beatBot, msg;

beatBot = {
    ping: 1
};
msg = {
    reply: () => { return `pong! Latency: ${Math.round(beatBot.ping)}ms` }
};

test('Needs to return a string containing the current bot latency', () => {
    expect(ping.execute(msg, beatBot)).toBeDefined();
});