let search = '!play zelda and chill';

let args = search.split(' ');

test('Needs to return the first argument of the message', () => {
    expect(args.shift()).toBe('!play');
});