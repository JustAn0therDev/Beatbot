const env = require('dotenv');
env.config();
module.exports = {
    API_KEY: process.env.API_KEY,
    AUTH_TOKEN: process.env.AUTH_TOKEN
};