const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const sentences = require('./sentences.json');
const Logger = require('./logger');

console.clear();

if (!Array.isArray(config.tokens) || config.tokens.length === 0) {
    Logger.error('No tokens found in config.json. Please add at least one token.');
    process.exit(1);
}

if (!Array.isArray(config.channels) || config.channels.length === 0) {
    Logger.error('No channel IDs found in config.json. Please add at least one channel ID.');
    process.exit(1);
}

if (typeof config.interval !== 'number' || config.interval <= 0) {
    Logger.error('"interval" must be a valid number in config.json (in seconds).');
    process.exit(1);
}

if (typeof config.adminID !== 'string' || config.adminID.length === 0) {
    Logger.error('"adminID" must be a valid string in config.json.');
    process.exit(1);
}

if (typeof config.prefix !== 'string' || config.prefix.length === 0) {
    Logger.error('"prefix" must be a valid string in config.json.');
    process.exit(1);
}

const INTERVAL = config.interval * 1000;
const { tokens, channels, adminID, prefix, specialMessages = [] } = config;

let successCount = 0;
const totalCount = tokens.length;
const clients = [];
const allTimerCleanups = []; // Track all timer cleanup functions

// Channel cache sweep interval (every 10 minutes)
const CACHE_SWEEP_INTERVAL = 10 * 60 * 1000;

class RateLimitedQueue {
    constructor(delay = 1500, maxSize = 1000) {
        this.queue = [];
        this.running = false;
        this.delay = delay;
        this.maxSize = maxSize;
    }

    enqueue(fn) {
        if (this.queue.length >= this.maxSize) {
            Logger.warning('Queue max size reached, dropping task to prevent memory leak.');
            return;
        }
        this.queue.push(fn);
        this.run();
    }

    clear() {
        this.queue.length = 0;
    }

    async run() {
        if (this.running) return;
        this.running = true;

        while (this.queue.length > 0) {
            const fn = this.queue.shift();
            try {
                await fn();
            } catch (err) {
                Logger.error(`Queue task error: ${err.message}`);
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

// ── Graceful shutdown (registered ONCE, outside the loop) ──
let isShuttingDown = false;

function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    Logger.warning(`Received ${signal}. Shutting down gracefully...`);

    // Clear all timers for all clients
    for (const cleanup of allTimerCleanups) {
        cleanup();
    }

    // Destroy all clients
    for (const client of clients) {
        try {
            client.destroy();
        } catch {}
    }

    // Clear the clients array
    clients.length = 0;

    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('exit', () => {
    // Last resort cleanup - timers won't fire after exit anyway,
    // but we release object references
    for (const cleanup of allTimerCleanups) {
        cleanup();
    }
});

(async () => {
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        const client = new Client({});
        clients.push(client);

        const sendQueue = new RateLimitedQueue(1500);

        const timers = {
            randomMessageTimeout: null,
            randomMessageInterval: null,
            specialMessageTimeouts: [],
            specialMessageIntervals: [],
            cacheSweepInterval: null
        };

        let isPaused = false;
        let messageCount = 0;
        let lastChannelID = null;
        let lastMessageTime = null;
        let specialSentCount = new Map();

        const clearAllTimers = () => {
            if (timers.randomMessageTimeout) {
                clearTimeout(timers.randomMessageTimeout);
                timers.randomMessageTimeout = null;
            }
            if (timers.randomMessageInterval) {
                clearInterval(timers.randomMessageInterval);
                timers.randomMessageInterval = null;
            }
            timers.specialMessageTimeouts.forEach(tid => clearTimeout(tid));
            timers.specialMessageIntervals.forEach(iid => clearInterval(iid));
            timers.specialMessageTimeouts = [];
            timers.specialMessageIntervals = [];

            // Also clear any pending queue tasks when pausing
            sendQueue.clear();
        };

        // Register this client's cleanup function globally
        allTimerCleanups.push(() => {
            clearAllTimers();
            if (timers.cacheSweepInterval) {
                clearInterval(timers.cacheSweepInterval);
                timers.cacheSweepInterval = null;
            }
        });

        const startTimers = () => {
            if (isPaused) return;

            // IMPORTANT: Clear existing timers before starting new ones
            // to prevent timer stacking on multiple resume calls
            clearAllTimers();

            const initialDelay = Math.floor(Math.random() * INTERVAL);

            timers.randomMessageTimeout = setTimeout(() => {
                if (isPaused) return;

                const sendRandomMessage = () => {
                    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
                    const randomChannelId = channels[Math.floor(Math.random() * channels.length)];

                    sendQueue.enqueue(async () => {
                        if (isPaused) return; // Double-check before sending
                        const channel = await client.channels.fetch(randomChannelId).catch(() => null);
                        if (!channel) {
                            Logger.error(`[${index + 1}] Channel not found: ${randomChannelId}`);
                            return;
                        }

                        try {
                            await channel.send(randomSentence);
                            messageCount++;
                            lastChannelID = randomChannelId;
                            lastMessageTime = Date.now();
                        } catch {}
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
                    Logger.error(`[${index + 1}] Invalid special message config at index ${i}. Skipping.`);
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
                            // Clean up completed entries from the Map
                            specialSentCount.delete(id);
                            // Remove from tracked intervals
                            const idx = timers.specialMessageIntervals.indexOf(intervalHandle);
                            if (idx !== -1) timers.specialMessageIntervals.splice(idx, 1);
                            return;
                        }

                        const targetChannelId = channelId
                            ? channelId
                            : channels[Math.floor(Math.random() * channels.length)];

                        sendQueue.enqueue(async () => {
                            if (isPaused) return;
                            const targetChannel = await client.channels.fetch(targetChannelId).catch(() => null);
                            if (!targetChannel) {
                                Logger.error(`[${index + 1}] Special message channel not found: ${targetChannelId}`);
                                return;
                            }
                            try {
                                await targetChannel.send(content);
                                specialSentCount.set(id, (specialSentCount.get(id) || 0) + 1);
                                messageCount++;
                                lastChannelID = targetChannel.id;
                                lastMessageTime = Date.now();
                            } catch (err) {
                                Logger.error(`[${index + 1}] Special message send error: ${err.message}`);
                            }
                        });

                    }, delayMs);

                    timers.specialMessageIntervals.push(intervalHandle);
                }, delayUntilStart);

                timers.specialMessageTimeouts.push(timeoutId);
            });
        };

        // ── Periodic channel cache sweep to prevent unbounded growth ──
        timers.cacheSweepInterval = setInterval(() => {
            const before = client.channels.cache.size;
            // Only keep channels that are in our config
            const channelSet = new Set(channels);
            client.channels.cache.sweep(ch => !channelSet.has(ch.id));
            const after = client.channels.cache.size;
            if (before > after) {
                Logger.debug(`[${index + 1}] Swept ${before - after} cached channels (${before} → ${after})`);
            }
        }, CACHE_SWEEP_INTERVAL);

        client.on('ready', () => {
            Logger.success(`[${index + 1}] Logged in as ${client.user.username}`);
            startTimers();
        });

        client.on('messageCreate', async (message) => {
            // Fast bail-out: skip messages not from admin as early as possible
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
                        startTimers,
                        messageCount,
                        lastChannelID,
                        lastMessageTime,
                        specialSentCount,
                        sendQueue
                    });
                } catch (err) {
                    Logger.error(`Command error: ${cmd} - ${err.message}`);
                    try {
                        await message.reply('❌ An error occurred while executing the command.');
                    } catch {}
                }
            }
        });

        try {
            await client.login(token.trim());
            successCount++;
        } catch (err) {
            Logger.error(`[${index + 1}] Token login failed: ${err.message}`);
        }
    }

    console.log('──────────────────────────────────────');
    Logger.success(`${successCount}/${totalCount} accounts successfully logged in.`);
    if (successCount < totalCount) {
        Logger.error(`${totalCount - successCount} tokens invalid.`);
    }
})();
