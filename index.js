const { Client, Options } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const config = require('./settings/config.json');
const sentences = require('./data/sentences.json');
const terminal = require('./core/terminal');
const Logger = require('./core/logger');
const state = require('./core/state');
const dashboard = require('./core/dashboard');
const networkMonitor = require('./core/network');

const tokensPath = path.join(__dirname, 'settings', 'tokens.txt');
if (!fs.existsSync(tokensPath)) {
    console.error('[ERROR] tokens.txt file not found. Please create settings/tokens.txt and add your tokens.');
    process.exit(1);
}

const tokensContent = fs.readFileSync(tokensPath, 'utf8');
const tokens = tokensContent
    .split(/\r?\n/)
    .map(line => {
        const hashIdx = line.indexOf('#');
        let clean = hashIdx !== -1 ? line.substring(0, hashIdx) : line;
        clean = clean.trim();
        if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
            clean = clean.slice(1, -1).trim();
        }
        return clean;
    })
    .filter(t => t.length > 0);

if (tokens.length === 0) {
    console.error('[ERROR] No tokens found in settings/tokens.txt. Please add at least one token.');
    process.exit(1);
}

if (!Array.isArray(config.channels) || config.channels.length === 0) {
    console.error('[ERROR] No channel IDs found in settings/config.json. Please add at least one channel ID.');
    process.exit(1);
}

if (typeof config.interval !== 'number' || config.interval <= 0) {
    console.error('[ERROR] "interval" must be a valid number in settings/config.json (in seconds).');
    process.exit(1);
}

if (typeof config.adminID !== 'string' || config.adminID.length === 0) {
    console.error('[ERROR] "adminID" must be a valid string in settings/config.json.');
    process.exit(1);
}

if (typeof config.prefix !== 'string' || config.prefix.length === 0) {
    console.error('[ERROR] "prefix" must be a valid string in settings/config.json.');
    process.exit(1);
}

terminal.init();
dashboard.init();
networkMonitor.start();

const INTERVAL = config.interval * 1000;
const { channels, adminID, prefix } = config;

let successCount = 0;
const totalCount = tokens.length;
const clients = [];
const allTimerCleanups = [];
const CACHE_SWEEP_INTERVAL = 5 * 60 * 1000;

state.set('totalAccounts', totalCount);

for (const chId of channels) {
    state.addChannel(chId);
}

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

let isShuttingDown = false;

function gracefulShutdown(signal) {
    if (isShuttingDown) return;
    isShuttingDown = true;
    Logger.warning(`Received ${signal}. Shutting down gracefully...`);

    networkMonitor.stop();

    for (const cleanup of allTimerCleanups) {
        cleanup();
    }

    for (const client of clients) {
        try {
            client.destroy();
        } catch { }
    }

    clients.length = 0;

    dashboard.destroy();
    Logger.close();
    terminal.cleanup();

    process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('exit', () => {
    for (const cleanup of allTimerCleanups) {
        cleanup();
    }
});

(async () => {
    Logger.info(`Starting login for ${totalCount} accounts...`);

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        const client = new Client({
            sweepInterval: 300,
            makeCache: Options.cacheWithLimits({
                MessageManager: 0,
                GuildMemberManager: 0,
                ThreadManager: 0,
                ThreadMemberManager: 0,
                ReactionManager: 0,
                ReactionUserManager: 0,
                GuildStickerManager: 0,
                GuildEmojiManager: 0,
                GuildInviteManager: 0,
                GuildScheduledEventManager: 0,
                PresenceManager: 0,
                StageInstanceManager: 0,
                VoiceStateManager: 0,
                UserManager: {
                    maxSize: 1,
                    keepOverLimit: (user) => user.id === client.user?.id,
                },
            }),
        });
        clients.push(client);

        const sendQueue = new RateLimitedQueue(1500);

        const timers = {
            randomMessageTimeout: null,
            randomMessageInterval: null,
            cacheSweepInterval: null
        };

        const performCacheSweep = () => {
            const channelSet = new Set(channels);

            const targetGuildIds = new Set();
            channelSet.forEach(chId => {
                const ch = client.channels.cache.get(chId);
                if (ch && ch.guildId) {
                    targetGuildIds.add(ch.guildId);
                }
            });

            // Sweep client channels
            client.channels.cache.sweep(ch => !channelSet.has(ch.id));

            // Sweep client guilds
            client.guilds.cache.sweep(g => !targetGuildIds.has(g.id));

            // Sweep sub-caches of remaining guilds
            client.guilds.cache.forEach(guild => {
                if (guild.channels && guild.channels.cache) {
                    guild.channels.cache.sweep(ch => !channelSet.has(ch.id));
                }
                if (guild.members && guild.members.cache) {
                    guild.members.cache.sweep(m => m.id !== client.user?.id);
                }
                if (guild.presences && guild.presences.cache) {
                    guild.presences.cache.clear();
                }
                if (guild.roles && guild.roles.cache) {
                    guild.roles.cache.clear();
                }
                if (guild.emojis && guild.emojis.cache) {
                    guild.emojis.cache.clear();
                }
                if (guild.stickers && guild.stickers.cache) {
                    guild.stickers.cache.clear();
                }
            });

            if (client.users && client.users.cache) {
                client.users.cache.sweep(u => u.id !== client.user?.id);
            }
        };

        let isPaused = false;
        let messageCount = 0;
        let lastChannelID = null;
        let lastMessageTime = null;


        let wasActive = false;
        let isInvalidated = false;

        const handleTokenInvalidation = (reason, isInitial = false) => {
            if (isInvalidated) return;
            isInvalidated = true;

            if (isInitial || !wasActive) {
                Logger.error(`Token login failed: ${reason}`, index + 1);
            } else {
                Logger.error(`Token became invalid during runtime: ${reason}`, index + 1);
            }

            clearAllTimers();

            if (wasActive) {
                wasActive = false;
                state.decrement('activeAccounts');
            }
            state.increment('invalidTokens');

            try {
                client.destroy();
            } catch {}
        };

        const clearAllTimers = () => {
            if (timers.randomMessageTimeout) {
                clearTimeout(timers.randomMessageTimeout);
                timers.randomMessageTimeout = null;
            }
            if (timers.randomMessageInterval) {
                clearInterval(timers.randomMessageInterval);
                timers.randomMessageInterval = null;
            }


            sendQueue.clear();
        };

        allTimerCleanups.push(() => {
            clearAllTimers();
            if (timers.cacheSweepInterval) {
                clearInterval(timers.cacheSweepInterval);
                timers.cacheSweepInterval = null;
            }
        });

        const startTimers = () => {
            if (isPaused) return;

            clearAllTimers();

            const initialDelay = Math.floor(Math.random() * INTERVAL);

            timers.randomMessageTimeout = setTimeout(() => {
                if (isPaused) return;

                const sendRandomMessage = () => {
                    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
                    const randomChannelId = channels[Math.floor(Math.random() * channels.length)];

                    sendQueue.enqueue(async () => {
                        if (isPaused) return;
                        if (!networkMonitor.online) return;
                        const channel = client.channels.cache.get(randomChannelId);
                        if (!channel) {
                            Logger.error(`Channel not found: ${randomChannelId}`, index + 1);
                            return;
                        }

                        try {
                            await channel.send(randomSentence);
                            messageCount++;
                            lastChannelID = randomChannelId;
                            lastMessageTime = Date.now();

                            state.increment('messagesSent');
                        } catch (err) {
                            if (networkMonitor.handleError(err)) return;
                            if (err.httpStatus === 429 || (err.message && err.message.includes('rate limit'))) {
                                state.increment('rateLimits');
                                const retryAfter = err.retryAfter || 'unknown';
                                Logger.warning(`Rate limited for ${retryAfter}s`, index + 1);
                            } else if (err.httpStatus === 401 || (err.message && (err.message.includes('401') || err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token')))) {
                                handleTokenInvalidation(err.message);
                            } else {
                                Logger.error(`Message send error: ${err.message}`, index + 1);
                            }
                        }
                    });
                };

                sendRandomMessage();

                timers.randomMessageInterval = setInterval(() => {
                    if (isPaused) return;
                    sendRandomMessage();
                }, INTERVAL);

            }, initialDelay);
        };

        timers.cacheSweepInterval = setInterval(() => {
            performCacheSweep();
        }, CACHE_SWEEP_INTERVAL);

        client.on('shardDisconnect', (event) => {
            if (event && event.code === 4004) {
                handleTokenInvalidation('Gateway close code 4004 (Authentication failed)');
            }
        });

        client.on('ready', async () => {
            wasActive = true;
            Logger.success(`Logged in as ${client.user.username}`, index + 1);

            state.increment('activeAccounts');

            for (const chId of channels) {
                try {
                    await client.channels.fetch(chId);
                } catch (err) {
                    Logger.error(`Failed to pre-fetch channel ${chId}: ${err.message}`, index + 1);
                }
            }

            performCacheSweep();
            startTimers();
        });

        client.on('messageCreate', async (message) => {
            if (message.author.id !== adminID) return;
            if (!message.content.startsWith(prefix)) return;

            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const cmd = args.shift().toLowerCase();

            const command = commands.get(cmd);
            if (command) {
                state.increment('commandsUsed');
                Logger.command(`!${cmd} used by ${message.author.username}`, index + 1);

                try {
                    await command.execute({
                        message,
                        client,
                        isPaused,
                        setPaused: v => {
                            isPaused = v;
                            state.set('isPaused', v);
                        },
                        clearAllTimers,
                        startTimers,
                        sendQueue,
                        state,
                    });
                } catch (err) {
                    Logger.error(`Command error: ${cmd} - ${err.message}`);
                    try {
                        await message.reply('❌ An error occurred while executing the command.');
                    } catch { }
                }
            }
        });

        try {
            await client.login(token.trim());
            successCount++;
        } catch (err) {
            handleTokenInvalidation(err.message, true);
        }
    }

    Logger.info(`${successCount}/${totalCount} accounts successfully logged in.`);
})();