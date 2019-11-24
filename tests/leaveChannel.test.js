const leaveChannel = require('../commands/leaveChannel');

let msg = {
    guild: {
        voiceConnection: false
    },
    reply: content => content
}

test('Has to send a message to the current discord text channel and leave the channel if already in one.', () => {
    expect(leaveChannel.execute(msg)).toBeDefined();
});