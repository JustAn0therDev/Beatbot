module.exports = {
    treatErrorMessage: (error) => {
        return error.message !== undefined ? error.message : error;
    },
    compareValuesAndTypeOfObjects: (obj1, obj2) => {
        return obj1 === obj2;
    }
}