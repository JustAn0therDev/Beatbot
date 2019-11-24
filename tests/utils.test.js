const utils = require('../commands/utils');

let error = "Cannot read property x of undefined";

test('Needs to return what is inside an error message or itself', () => {
    expect(utils.treatErrorMessage(error)).toBeDefined();
});

test('Return the comparison of type and values of two different objects', () => {
    expect(utils.compareValuesAndTypeOfObjects('string', 'string')).toBeTruthy();
    expect(utils.compareValuesAndTypeOfObjects('string', false)).toBeFalsy();
});