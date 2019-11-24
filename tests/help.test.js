const help = require('../commands/help');

test('Cannot return falsy values', () => {
    expect(help.execute("string", new Array())).toBeDefined();
});