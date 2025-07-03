const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const sentences = require('./sentences.json');

if (!Array.isArray(config.tokens) || config.tokens.length === 0) {
    console.error('❌ [ERROR] No tokens found in config.json. Please add at least one token.');
    process.exit(1);
}

if (!Array.isArray(config.channels) || config.channels.length === 0) {
    console.error('❌ [ERROR] No channel IDs found in config.json. Please add at least one channel ID.');
    process.exit(1);
}

if (typeof config.interval !== 'number' || config.interval <= 0) {
    console.error('❌ [ERROR] "interval" must be a valid number in config.json (in seconds).');
    process.exit(1);
}

if (typeof config.adminID !== 'string' || config.adminID.length === 0) {
    console.error('❌ [ERROR] "adminID" must be a valid string in config.json.');
    process.exit(1);
}

if (typeof config.prefix !== 'string' || config.prefix.length === 0) {
    console.error('❌ [ERROR] "prefix" must be a valid string in config.json.');
    process.exit(1);
}

const INTERVAL = config.interval * 1000;
const { tokens, channels, adminID, prefix } = config;

const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
}

tokens.forEach((token, index) => {
    const client = new Client();

    // Per-client state
    let isPaused = false;
    let nextMessageTime = Date.now() + INTERVAL;
    let messageCount = 0;
    let lastChannelID = null;
    let lastMessageTime = null;

    client.on('ready', () => {
        console.log(`[${index + 1}] Logged in as ${client.user.username}.`);

        setInterval(() => {
            if (isPaused) return;

            const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
            const randomChannelId = channels[Math.floor(Math.random() * channels.length)];
            const channel = client.channels.cache.get(randomChannelId);

            if (!channel) {
                console.error(`[${index + 1}] Channel not found: ${randomChannelId}`);
                return;
            }

            channel.send(randomSentence).then(() => {
                messageCount++;
                lastChannelID = randomChannelId;
                lastMessageTime = Date.now();
                nextMessageTime = Date.now() + INTERVAL;
            }).catch(err => {
                console.error(`[${index + 1}] Failed to send message (${randomChannelId}):`, err.message);
            });
        }, INTERVAL);
    });

    client.on('messageCreate', async (message) => {
        if (message.author.id !== adminID) return;
        if (!message.content.startsWith(prefix)) return;

        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const cmd = args.shift().toLowerCase();

        const command = commands.get(cmd);
        if (command) {
            try {
                await command.execute({
                    message,
                    client,
                    isPaused,
                    setPaused: v => isPaused = v,
                    nextMessageTime,
                    messageCount,
                    lastChannelID,
                    lastMessageTime
                });
            } catch (err) {
                console.error(`Command error: ${cmd}`, err);
                await message.reply('❌ An error occurred while executing the command.');
            }
        }
    });

    client.login(token.trim()).catch(err => {
        console.error(`[${index + 1}] Token login failed:`, err.message);
    });
});
