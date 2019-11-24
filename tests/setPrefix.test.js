const setPrefix = require('../commands/setPrefix');
let beatBot, msg;

beatBot = { prefix: "!" };

msg = { 
    content: "!setPrefix =",
    channel: { 
        send: (returnMessage) => returnMessage  
    }
};

test('Return success message', () => {
    expect(setPrefix.execute(msg, beatBot)).toBeDefined();
});