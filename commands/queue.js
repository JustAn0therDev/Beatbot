module.exports = {
    name: 'queue',
    async execute(msg, beatBot, queue) {
        try {
            if (queue.length > 0) {
                let count = 1;
                await queue.forEach((value, key) => {
                    msg.channel.send(`${count} - ${key} ${value}`);
                    count++;
                });
            }
        } catch (error) {
            if (error.message != undefined || error.message !== "") {
                console.log(error.message);
                msg.channel.send(`${error.message}`)
            }
            else {
                console.log(error);
                msg.channel.send(`${error}`);
            }
        } 
    }
}