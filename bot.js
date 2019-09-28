const { Client } = require('discord.js');
const token = require('./authtoken');
const ytdl = require('ytdl-core'); 
let bot = new Client();
let prefix = "&";
let queue = new Map();

//Login to the discord API.
bot.login(token);

bot.on('message', msg => {
    if (msg.content.startsWith(`${prefix}ping`)) 
    msg.reply(`${bot.ping}ms`);
});

bot.on('message', msg => {
    if (!msg.content.startsWith(`${prefix}play`)) return;
    msg.content.trim();
    const args = msg.content.split(' ');
    if (msg.author.bot) return;
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

	if (!serverQueue) {
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
            msg.channel.send('Queue created and video added.');
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

function play(guild, song) {
	const serverQueue = queue.get(guild.id);
	if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
		return;
	}

    serverQueue.voiceChannel.join()
        .then(connection => {
        const stream = ytdl(song.url, { filter : 'audioonly' });
        connection.playStream(stream);
        })
        .catch(e => {
            console.log(e);
        });
}

bot.on('message', (msg) => {
    if (msg.content.startsWith(`${prefix}leave`)) {
      if (msg.guild.voiceConnection) {
           msg.guild.voiceConnection.channel.leave();
           msg.reply('Leaving channel!');
           
           //Resets the queue 
           queue = new Map();
    } else {
        msg.reply('I must be in a voice channel to leave!');  
    }
}
});