const utils = require('../commands/utils');

let error = "Cannot read property x of undefined";

let errorMessage = {
    message: "Unhandled exception."
}

test('Needs to return what is inside an error message or itself', () => {
    expect(utils.treatErrorMessage(error)).toBeDefined();
    expect(utils.treatErrorMessage(errorMessage.message)).toBeDefined();
});

test('Return the comparison of type and values of two different objects', () => {
    expect(utils.compareValuesAndTypeOfObjects('string', 'string')).toBeTruthy();
    expect(utils.compareValuesAndTypeOfObjects('string', false)).toBeFalsy();
});