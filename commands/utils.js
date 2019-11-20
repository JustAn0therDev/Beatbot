module.exports = {
    treatErrorMessage: (error) => {
        return error.message !== undefined ? error.message : error;
    }
}