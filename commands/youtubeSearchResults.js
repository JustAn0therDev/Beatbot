const axios = require('axios');
const axiosConfig = require('../APIs/axiosConfig');
const apiKey = require('../APIs/apikey');
const utils = require('./utils');

axios.default.create(axiosConfig);

module.exports = {
    search: (search) => {
        const args = search.split(' ');
        args.shift();
        axios.default.get('/search', {
            key: apiKey,
            part: 'snippet',
            type: 'video',
            maxResults: 10,
            q: args.join('+')
        }).then((res) => {
            const response = JSON.parse(res);
            return response;
        }).catch((e) => {
            return utils.treatErrorMessage(error);
        });
    }
}