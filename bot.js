const { Client } = require('discord.js');
const token = require('./authtoken');
const ytdl = require('ytdl-core'); 
let beatBot = new Client();
let prefix = "&";
let queue = new Map();

//Login to the discord API.
beatBot.login(token);

beatBot.on('message', msg => {
    if (msg.content.startsWith(`${prefix}ping`)) 
    msg.reply(`${beatBot.ping}ms`);
});

beatBot.on('message', msg => {
    if (!msg.content.startsWith(`${prefix}play`)) return;
    msg.content.trim();
    const args = msg.content.split(' ');
    if (msg.author.beatBot) return;
    if (!args[1]) return msg.reply(`you must send me a link for me to play the video`);
    const serverQueue = queue.get(msg.guild.id);

	if (msg.content.startsWith(`${prefix}play`)) {
		execute(msg, serverQueue);
	} else if (msg.content.startsWith(`${prefix}skip`)) {   
		skip(msg, serverQueue);
	} else if (msg.content.startsWith(`${prefix}pause`)) {
        pause(msg, serverQueue);
    } else if (msg.content.startsWith(`${prefix}resume`)) {
        resume(msg, serverQueue);
        return;
    } else if (msg.content.startsWith(`${prefix}stop`)) {
        stop(msg, serverQueue);
    }
});

async function execute(msg, serverQueue) {
    const args = msg.content.split(' ');

	const voiceChannel = msg.member.voiceChannel;
	if (!voiceChannel) return msg.reply('you need to be in a voice channel to play a video.');
	const permissions = voiceChannel.permissionsFor(msg.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return msg.reply('I do not have the permission to speak or join the current voice channel.');
    }

	const songInfo = await ytdl.getInfo(args[1]);
	const song = {
		title: songInfo.title,
		url: songInfo.video_url,
	};
    // !serverQueue

    //It checks if serverQueue doesn't have an undefined or null value and checks if it has songs in its queue.
	if (!serverQueue || serverQueue.songs.length == 0) {
		const queueConstruct = {
			textChannel: msg.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};
		queue.set(msg.guild.id, queueConstruct);
		queueConstruct.songs.push(song);

		try {
			var connection = voiceChannel.join();
            queueConstruct.connection = connection;
            msg.channel.send(`Now playing: ${song.title}`);
            if (queueConstruct.songs.length > 0) {
                play(msg.guild, queueConstruct.songs[0]);
            } else {
                msg.guild.voiceConnection.channel.leave();
                msg.reply('Leaving channel!');
            }
		} catch (err) {
			queue.delete(msg.guild.id);
			msg.channel.send(err);
		}
	} else {
        msg.channel.send(`The following video has been added to the queue: ${song.title}`);
        serverQueue.songs.push(song); 
	}

}

function skip(msg, serverQueue) {
	if (!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel to stop the queue!');
	if (!serverQueue) return msg.reply('there is no video I can skip.');
    serverQueue.connection.dispatcher.end();
    msg.channel.send('Video skipped.');
}

function pause(msg, serverQueue) {
    if(!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel.');
    if (!serverQueue) return msg.reply('there is no video for me to pause.');
    serverQueue.connection.dispatcher.pause();
    msg.channel.send('Video paused.');
}

function resume(msg, serverQueue) {
    if(!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel.');
    if (!serverQueue) return msg.reply('there is no video for me to resume.');
    serverQueue.connection.dispatcher.resume();
    msg.channel.send('Video resumed.');
}

function stop(msg, serverQueue) {
	if (!msg.member.voiceChannel) return msg.reply('you have to be in a voice channel to stop the queue!');
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
    msg.channel.send('Queue stopped and cleaned.');
}

async function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
		return;
	}

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
			serverQueue.textChannel.sendMessage(JSON.stringify(error));
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

beatBot.on('message', (msg) => {
    if (msg.content.startsWith(`${prefix}queue`)) {
        if (queue.length == 1) {
            msg.channel.send(`There is currently one song in queue`);
        } else if (queue.length > 1) {
            msg.channel.send(`There are currently ${queue.length} songs in queue`);
        } else {
            msg.channel.send(`There are currently no songs in queue`);
        }
    }
});

beatBot.on('message', (msg) => {
    if (msg.content.startsWith(`${prefix}leave`)) {
      if (msg.guild.voiceConnection) {
           msg.guild.voiceConnection.channel.leave();
           msg.reply('leaving channel!');
           delete serverQueue;
    } else {
        msg.reply('I must be in a voice channel to leave!');  
    }
}
});