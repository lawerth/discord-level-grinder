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
const { tokens, channels, adminID, prefix, specialMessages = [] } = config;

let successCount = 0;
const totalCount = tokens.length;

// Rate limit kuyruğu sınıfı
class RateLimitedQueue {
    constructor(delay = 1500) {
        this.queue = [];
        this.running = false;
        this.delay = delay;
    }

    enqueue(fn) {
        this.queue.push(fn);
        this.run();
    }

    async run() {
        if (this.running) return;
        this.running = true;

        while (this.queue.length > 0) {
            const fn = this.queue.shift();
            try {
                await fn();
            } catch (err) {
                console.error('Queue task error:', err);
            }
            await new Promise(r => setTimeout(r, this.delay));
        }

        this.running = false;
    }
}

const commands = new Map();
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(__dirname, 'commands', file));
    commands.set(command.name.toLowerCase(), command);
}

(async () => {
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        const client = new Client();

        const sendQueue = new RateLimitedQueue(1500);

        const timers = {
            randomMessageTimeout: null,
            randomMessageInterval: null,
            specialMessageTimeouts: [],
            specialMessageIntervals: []
        };

        let isPaused = false;
        let messageCount = 0;
        let lastChannelID = null;
        let lastMessageTime = null;
        let specialSentCount = new Map();

        client.on('ready', () => {
            console.log(`[${index + 1}] Logged in as ${client.user.username}.`);

            const initialDelay = Math.floor(Math.random() * INTERVAL);

            timers.randomMessageTimeout = setTimeout(() => {
                if (isPaused) return;

                const sendRandomMessage = () => {
                    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
                    const randomChannelId = channels[Math.floor(Math.random() * channels.length)];

                    sendQueue.enqueue(async () => {
                        const channel = await client.channels.fetch(randomChannelId).catch(() => null);
                        if (!channel) {
                            console.error(`[${index + 1}] Channel not found: ${randomChannelId}`);
                            return;
                        }
                        await channel.send(randomSentence);
                        messageCount++;
                        lastChannelID = randomChannelId;
                        lastMessageTime = Date.now();
                    });
                };

                sendRandomMessage();

                timers.randomMessageInterval = setInterval(() => {
                    if (isPaused) return;
                    sendRandomMessage();
                }, INTERVAL);

            }, initialDelay);

            specialMessages.forEach((msg, i) => {
                const { content, startAfter, repeat, interval, channelId, perClientDelay } = msg;
                if (
                    !content ||
                    typeof startAfter !== 'number' || startAfter < 0 ||
                    typeof repeat !== 'number' || repeat <= 0 ||
                    typeof interval !== 'number' || interval <= 0
                ) {
                    console.error(`[${index + 1}] Invalid special message config at index ${i}. Skipping.`);
                    return;
                }

                const delayMs = interval * 1000;
                const delayUntilStart = startAfter * 1000 + ((typeof perClientDelay === 'number') ? perClientDelay : 0) * 1000 * index;
                const id = `${i}`;

                specialSentCount.set(id, 0);

                const timeoutId = setTimeout(() => {
                    const intervalHandle = setInterval(() => {
                        const sent = specialSentCount.get(id) || 0;
                        if (sent >= repeat) {
                            clearInterval(intervalHandle);
                            return;
                        }

                        const targetChannelId = channelId
                            ? channelId
                            : channels[Math.floor(Math.random() * channels.length)];

                        sendQueue.enqueue(async () => {
                            const targetChannel = await client.channels.fetch(targetChannelId).catch(() => null);
                            if (!targetChannel) {
                                console.error(`[${index + 1}] Special message channel not found: ${targetChannelId}`);
                                return;
                            }
                            await targetChannel.send(content);
                            specialSentCount.set(id, sent + 1);
                            messageCount++;
                            lastChannelID = targetChannel.id;
                            lastMessageTime = Date.now();
                        });

                    }, delayMs);

                    timers.specialMessageIntervals.push(intervalHandle);
                }, delayUntilStart);

                timers.specialMessageTimeouts.push(timeoutId);
            });
        });

        const clearAllTimers = () => {
            if (timers.randomMessageTimeout) clearTimeout(timers.randomMessageTimeout);
            if (timers.randomMessageInterval) clearInterval(timers.randomMessageInterval);
            timers.specialMessageTimeouts.forEach(tid => clearTimeout(tid));
            timers.specialMessageIntervals.forEach(iid => clearInterval(iid));
        };

        process.on('exit', () => {
            clearAllTimers();
            client.destroy();
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
                        clearAllTimers,
                        messageCount,
                        lastChannelID,
                        lastMessageTime,
                        specialSentCount,
                        sendQueue
                    });
                } catch (err) {
                    console.error(`Command error: ${cmd}`, err);
                    await message.reply('❌ An error occurred while executing the command.');
                }
            }
        });

        try {
            await client.login(token.trim());
            successCount++;
        } catch (err) {
            console.error(`[${index + 1}] Token login failed:`, err.message);
        }
    }

    // Giriş özetini yaz
    console.log('────────────────────────────────');
    console.log(`✅ ${successCount}/${totalCount} accounts successfully logged in.`);
    if (successCount < totalCount) {
        console.log(`❌ ${totalCount - successCount} token geçersiz.`);
    }
})();
