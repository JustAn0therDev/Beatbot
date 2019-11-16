const { Client } = require('discord.js');
const fs = require('fs');
const token = require('./authtoken');
const ytdl = require('ytdl-core'); 
const beatBot = new Client();
const queue = new Map();
beatBot.prefix = "&";
const commandFiles = fs.readdirSync('./commands');
const commands = [];
for (let i = 0; i < commandFiles.length; i++) {
    commands.push(require(`./commands/${commandFiles[i]}`));
}

beatBot.login(token);

commands.forEach((command) => {
    beatBot.on('message', (msg) => {
        if(msg.content.startsWith(`${beatBot.prefix}${command.name}`) && !msg.author.bot) {
            if (command.helpCommand === undefined) 
                command.execute(msg, beatBot, queue);
            else 
                command.helpCommand(msg, commands);
        }
    });
});

//---------------------------------------------------------------

/* Voice channel and video play commands will stay in the same bot.js file
 because they need a global variable context for the Map queue to work properly. */
beatBot.on('message', msg => {
    if (!msg.content.startsWith(`${beatBot.prefix}`)) return;
    msg.content.trim();
    const serverQueue = queue.get(msg.guild.id);

	if (msg.content.startsWith(`${beatBot.prefix}play`)) {
        const args = msg.content.split(' ');
        if (!args[1]) return msg.reply(`you must send me a link for me to play the video`);
		executePlay(msg, serverQueue);
	} else if (msg.content.startsWith(`${beatBot.prefix}skip`)) {   
		skip(msg, serverQueue);
	} else if (msg.content.startsWith(`${beatBot.prefix}pause`)) {
        pause(msg, serverQueue);
    } else if (msg.content.startsWith(`${beatBot.prefix}resume`)) {
        resume(msg, serverQueue);
        return;
    } else if (msg.content.startsWith(`${beatBot.prefix}stop`)) {
        stop(msg, serverQueue);
    } else if (msg.content.startsWith(`${beatBot.prefix}nowplaying`)) {
        nowPlaying(msg, serverQueue);
    } else {
        return;
    }
});

async function executePlay(msg, serverQueue) {
    const args = msg.content.split(' ');
    var songInfo;
	const voiceChannel = msg.member.voiceChannel;
    if (!voiceChannel) return msg.reply('you need to be in a voice channel to play a video.');
    
    const permissions = voiceChannel.permissionsFor(msg.client.user);
    
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return msg.reply('I do not have the permission to speak or join the current voice channel.');
    }

    try {
        songInfo = await ytdl.getInfo(args[1]);
    } catch (error) {
        msg.channel.send(`The requested video cannot be played because I received the following error from the YouTube API: "${error.message}"`);
        return;
    }

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
            msg.channel.send(`Now playing: ${song.title}`);
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
        await msg.channel.send(`The following video has been added to the queue: ${song.title}`);
        serverQueue.songs.push(song); 
	}

}

async function skip(msg, serverQueue) {
	if (!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel to stop the queue!');
    if (!serverQueue) return msg.reply('there is no video I can skip.');
    try {
       await serverQueue.connection.dispatcher.end();
    } catch (e) {
        console.log(e);
        await msg.channel.send(`Video ${serverQueue.songs[0].title} skipped.`);
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
        await msg.channel.send(`Now playing: ${serverQueue.songs[0].title}`);
    } else {
        await msg.channel.send("There is nothing playing right now.");
    }
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
			console.log('Music ended!');
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
        msg.guild.defaultChannel.send(error);
    }
}