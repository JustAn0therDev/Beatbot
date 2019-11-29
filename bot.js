//GLOBAL VARIABLES-----------------------------------------
//Require modules and constants

//Discord.js client module and instance.
const Discord = require('discord.js');
const { Client } = require('discord.js');

//Fs required for managing decoupled files.
const fs = require('fs');

//Token and API configurations.
const token = require('./APIs/authtoken');
const apiKey = require('./APIs/apikey');

//Axios instance and configurating the external API's endpoint.
const axios = require('axios');

//Youtube Downloader.
const ytdl = require('ytdl-core'); 
//Instance of the discord client module.
const beatBot = new Client();

//Utilities module.
const beatBotUtils = require('./commands/utils');

//Song queue.
const queue = new Map();
beatBot.prefix = "&";

const commandFiles = fs.readdirSync('./commands');
const commands = [];
//End Require modules and constants.

//Global vars when checking certain statuses.
var isRepeating = false;
var currentYouTubeVideoList = {};
//End global vars.

for (let i = 0; i < commandFiles.length; i++) {
    commands.push(require(`./commands/${commandFiles[i]}`));
}

beatBot.login(token);

commands.forEach((command) => {
    beatBot.on('message', (msg) => {
        if(msg.content.startsWith(`${beatBot.prefix}${command.name}`) && !msg.author.bot) {
            switch (command.name) {
                case "help":
                    command.execute(msg, commands);
                    break;
                default:
                    command.execute(msg, beatBot, queue);
                    break;
            }
        }
    });
});

//---------------------------------------------------------------

/* Voice channel and video play commands will stay in the same bot.js file
 because they need a global variable context for the Map queue to work properly. */
beatBot.on('message', msg => {
    if (!msg.content.startsWith(`${beatBot.prefix}`)) return;
    msg.content.trim();
    let startsWith = msg.content.split(' ')[0];
    const serverQueue = queue.get(msg.guild.id);

    switch (startsWith) {
        case `${beatBot.prefix}play`:
            const args = msg.content.split(' ');
            if (!args[1]) return msg.reply('you must specify a link or search for me to play a video!');
            executePlay(msg, serverQueue);
            break;

        case `${beatBot.prefix}skip`:
            skip(msg, serverQueue);
            break;

        case `${beatBot.prefix}pause`: 
            pause(msg, serverQueue);
            break;

        case `${beatBot.prefix}resume`: 
            resume(msg, serverQueue);
            break;

        case `${beatBot.prefix}stop`:
            stop(msg, serverQueue);
            break;

        case `${beatBot.prefix}nowplaying`:
            nowPlaying(msg, serverQueue);
            break;

        case `${beatBot.prefix}queue`:
            checkCurrentQueue(msg, serverQueue);
            break;

        case `${beatBot.prefix}repeat`:
            repeatCurrentSong(msg, serverQueue);
            break;
            
            default: 
            break;
    }
});

async function executePlay(msg, serverQueue) {
    const args = msg.content.split(' ');
    var songInfo = {};

	const voiceChannel = msg.member.voiceChannel;
    if (!voiceChannel) return msg.reply('you need to be in a voice channel to play a video.');
    
    const permissions = voiceChannel.permissionsFor(msg.client.user);
    
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return msg.reply('I do not have the permission to speak or join the current voice channel.');
    }

    try {
        if (args[1].includes('https://')) 
            songInfo = await ytdl.getInfo(args[1]);
        else {

            let embedSearchResultsList = new Discord.RichEmbed()
            .setColor('#10B631')
            .setTitle('These are the videos I found!')
            .setDescription('Take a look at the videos I found and choose one!');
            args.shift();

            //The YouTube API only accepts the space characters as '+' on it's query parameters
            //and the promise receives two functions in case something goes wrong on the API call.
            await searchForYoutubeVideo(msg, args.join('+')).then(response => response, (error) => { console.log(beatBotUtils.treatErrorMessage(error)) });

            currentYouTubeVideoList.forEach((item) => {
                embedSearchResultsList.addField(`${currentYouTubeVideoList.indexOf(item) + 1} - ${item.snippet.title}`, "----------------");
            });

            await msg.channel.send(embedSearchResultsList).then(async () => {
                await msg.channel.awaitMessages(message => message.author.id === msg.author.id, { time: 10000 }).then(async collected => {
                        songInfo = await ytdl.getInfo(`https://youtube.com/watch?v=${currentYouTubeVideoList[collected.first().content - 1].id.videoId}`)
                    })
                    .catch((collected) => {
                        msg.channel.send("Couldn't find the requested video on the list.");
                        return false;
                    });
            });
        }

    } catch (error) {
        console.error(beatBotUtils.treatErrorMessage(error));
        msg.channel.send(`The requested video cannot be played because I bumped into the following error: "${beatBotUtils.treatErrorMessage(error)}"`);
        return;
    }
    if (songInfo.title !== undefined && songInfo.video_url !== undefined) {
        const song = {
            title: songInfo.title,
            url: songInfo.video_url,
        };
        //It checks if serverQueue doesn't have an undefined or null value and checks if it has songs in its queue.
        if (!serverQueue || serverQueue.songs.length === 0) {
            const queueConstruct = {
                textChannel: msg.channel,
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
                volume: 5,
                playing: true
            };
            queue.set(msg.guild.id, queueConstruct);
            queueConstruct.songs.push(song);

            try {
                var connection = await voiceChannel.join();
                queueConstruct.connection = connection;
                msg.channel.send(`Now playing: **${song.title}**`);
                if (queueConstruct.songs.length > 0) {
                    await play(msg.guild, queueConstruct.songs[0]);
                } else {
                    await msg.guild.voiceConnection.channel.leave();
                    msg.reply('Leaving channel!');
                }
            } catch (err) {
                queue.delete(msg.guild.id);
                msg.channel.send(err);
            }
        } else {
            await msg.channel.send(`The following video has been added to the queue: **${song.title}**`);
            serverQueue.songs.push(song); 
        }
    }
}

async function skip(msg, serverQueue) {
	if (!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel to stop the queue!');
    if (!serverQueue) return msg.reply('there is no video I can skip.');

    try {
       isRepeating = false;
       await serverQueue.connection.dispatcher.end();
    } catch (e) {
        console.error(beatBotUtils.treatErrorMessage(error));
        await msg.channel.send(`Video: **${serverQueue.songs[0].title}** skipped.`);
        serverQueue.songs.shift();
    }
}

async function pause(msg, serverQueue) {
    if(!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel.');
    if (!serverQueue) return msg.reply('there is no video for me to pause.');
    await serverQueue.connection.dispatcher.pause();
    msg.channel.send('Video paused.');
}

async function resume(msg, serverQueue) {
    if(!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel.');
    if (!serverQueue) return msg.reply('there is no video for me to resume.');
    await serverQueue.connection.dispatcher.resume();
    msg.channel.send('Video resumed.');
}

async function stop(msg, serverQueue) {
	if (!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel to stop the queue!');
    serverQueue.songs = [];
    await serverQueue.connection.dispatcher.end();
    msg.channel.send('Queue stopped and cleaned.');
}

async function nowPlaying(msg, serverQueue) {
    if (serverQueue.songs.length > 0) {
        await msg.channel.send(`Now playing: **${serverQueue.songs[0].title}**`);
    } else {
        await msg.channel.send("There is nothing playing right now.");
    }
}

async function checkCurrentQueue(msg, serverQueue) {
    if (serverQueue.songs.length > 0) {
        let embedMessage = new Discord.RichEmbed()
        .setTitle('Songs in queue!')
        .setColor('#10B631')
        .setDescription('The current video queue!');
        let count = 1;
        await serverQueue.songs.forEach((item) => {
            embedMessage.addField(`${count} - **${item.title}**`, "----------------");
            count++;
        });

        msg.channel.send(embedMessage);
    } else {
        await msg.reply("the queue is currently empty.");
    }
}

async function repeatCurrentSong(msg, serverQueue) {
    if(serverQueue.songs.length > 0) {
        if(!isRepeating) {
            isRepeating = true;
            await msg.reply("repeating the current song.");
        } else {
            isRepeating = false;
            await msg.reply("returned to the normal queue.");
        }
    } else {
        await msg.reply("there is no song playing for me to repeat.");
    }
}

async function searchForYoutubeVideo(msg, search) {
    await axios.default.get('https://www.googleapis.com/youtube/v3/search', {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        params: {
            key: apiKey,
            part: 'snippet',
            type: 'video',
            maxResults: 10,
            q: search
        }
    }).then((res) => { 
        currentYouTubeVideoList = res.data.items;
     }).catch((e) => {
        return beatBotUtils.treatErrorMessage(e);
    });
}

async function play(guild, song) {
	const serverQueue = await queue.get(guild.id);

	if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
		return;
    }
    
    try { 
        const dispatcher = await serverQueue.voiceChannel.connection.playStream(ytdl(song.url))
		.on('end', () => {
            if (!isRepeating)
                serverQueue.songs.shift();
            
            if (serverQueue.songs.length > 0) {
                play(guild, serverQueue.songs[0]);
            } else {
                guild.voiceConnection.channel.leave();
            }
		})
		.on('error', error => {
            console.log(error);
        });

        dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);

    } catch (error) {
        console.error(beatBotUtils.treatErrorMessage(error));
    }
}