# Beatbot
A Discord Bot for playing music in a discord channel with queues and some other cool stuff. Made using [NodeJS](https://nodejs.org/), [Discord.js](https://discord.js.org/#/), [Axios](https://www.npmjs.com/package/axios),
and [ytdl-core](https://www.npmjs.com/package/ytdl-core).

This NodeJS application was made to be used in a controlled discord channel environment. Feel free to ask me anything
or fork the project and make pull requests 
(although you cannot run it locally due to the API_KEY and AUTH_TOKEN variables, for the Youtube Data API v3 and Discord logging, respectively).

## Things to keep in mind:

- If you do want to use the bot with your own discord token and YouTube API v3 Data Key, make sure to run the bot on a Windows machine,
since the ytdl-core depencency seems to be unstable on Unix (And if you have any suggestions on how to fix this lack of consistency, let me know!).

- Make sure you're always executing functions and requesting for external resources asynchronosly, as it can lower performance or break the application's current state.

- As of adding stuff to the YouTube video playing side of things, use global variables if they need to be referenced by another discord command.

## IMPORTANT
This bot is deprecated and not used anymore, as it was one of my first bots and the code is not reliable. The only maintainable discord bot today is [Burinbot](https://github.com/JustAn0therDev/Burinbot). If you want to re-use this code and adapt it to your necessity, feel free to do so.
