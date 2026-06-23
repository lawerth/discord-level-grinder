const { Client, Options } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');
const https = require('https');
const tls = require('tls');
const config = require('./settings/config.json');
const sentences = require('./data/sentences.json');
const terminal = require('./core/terminal');
const Logger = require('./core/logger');
const state = require('./core/state');
const dashboard = require('./core/dashboard');
const networkMonitor = require('./core/network');
const tokenWatcher = require('./core/token-watcher');
const discordWs = require('discord.js-selfbot-v13/src/WebSocket');


const CHROME_USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

const CHROME_CIPHERS = [
    'TLS_AES_128_GCM_SHA256',
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-CHACHA20-POLY1305',
    'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-RSA-AES128-SHA',
    'ECDHE-RSA-AES256-SHA',
    'AES128-GCM-SHA256',
    'AES256-GCM-SHA384',
    'AES128-SHA',
    'AES256-SHA',
].join(':');

const wsAgent = new https.Agent({
    ciphers: CHROME_CIPHERS,
    honorCipherOrder: true,
    minVersion: 'TLSv1.2',
});


const _originalCreate = discordWs.create;
discordWs.create = (gateway, query = {}, ...args) => {
    const wsOptions = args[0] || {};
    wsOptions.headers = {
        'User-Agent': CHROME_USER_AGENT,
        'Origin': 'https://discord.com',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...(wsOptions.headers || {}),
    };
    if (!wsOptions.agent) {
        wsOptions.agent = wsAgent;
    }
    args[0] = wsOptions;
    return _originalCreate(gateway, query, ...args);
};

const tokensPath = path.join(__dirname, 'settings', 'tokens.txt');
if (!fs.existsSync(tokensPath)) {
    console.error('[ERROR] tokens.txt file not found. Please create settings/tokens.txt and add your tokens.');
    process.exit(1);
}

const tokensContent = fs.readFileSync(tokensPath, 'utf8');
const tokenLines = tokensContent.split(/\r?\n/);
const tokenEntries = [];

for (const line of tokenLines) {
    const trimmedLine = line.trim();
    // Skip standalone comment lines (lines starting with #)
    if (trimmedLine.startsWith('#') || trimmedLine.length === 0) continue;

    const hashIdx = trimmedLine.indexOf('#');
    let tokenPart, commentPart;
    if (hashIdx !== -1) {
        tokenPart = trimmedLine.substring(0, hashIdx).trim();
        commentPart = trimmedLine.substring(hashIdx + 1).trim();
    } else {
        tokenPart = trimmedLine;
        commentPart = '';
    }
    if ((tokenPart.startsWith('"') && tokenPart.endsWith('"')) || (tokenPart.startsWith("'") && tokenPart.endsWith("'"))) {
        tokenPart = tokenPart.slice(1, -1).trim();
    }
    if (tokenPart.length > 0) {
        tokenEntries.push({ token: tokenPart, username: commentPart || null });
    }
}

let tokens = tokenEntries.map(e => e.token);
const initialUsernames = tokenEntries.map(e => e.username);

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
let totalCount = tokens.length;
const clients = [];
const clientCleanups = [];
const allTimerCleanups = [];
const CACHE_SWEEP_INTERVAL = 5 * 60 * 1000;

function saveTokensFile() {
    tokenWatcher.writeTokensFile(tokens, state.getAccountMap(), tokensPath);
}

state.set('totalAccounts', totalCount);

for (let i = 0; i < initialUsernames.length; i++) {
    if (initialUsernames[i]) {
        state.setAccount(i, initialUsernames[i], 'pending');
    }
}

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
    tokenWatcher.stop();

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

async function startAccount(index, token) {
    const client = new Client({
        sweepInterval: 300,
        ws: {
            capabilities: 30717,
            agent: wsAgent,
        },
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
    clients[index] = client;

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

        client.channels.cache.sweep(ch => !channelSet.has(ch.id));

        client.guilds.cache.sweep(g => !targetGuildIds.has(g.id));

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
    let accountUsername = null;

    const handleTokenInvalidation = (reason, isInitial = false) => {
        if (isInvalidated) return;
        isInvalidated = true;

        const invalidName = accountUsername || 'Unknown';
        state.setAccount(index, invalidName, 'invalid');
        saveTokensFile();

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
        } catch { }
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

    const cleanupFn = () => {
        clearAllTimers();
        if (timers.cacheSweepInterval) {
            clearInterval(timers.cacheSweepInterval);
            timers.cacheSweepInterval = null;
        }
    };
    clientCleanups[index] = cleanupFn;
    allTimerCleanups.push(cleanupFn);

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
            handleTokenInvalidation('Invalid token');
        }
    });

    client.on('ready', async () => {
        wasActive = true;
        accountUsername = client.user.username;
        Logger.success(`Logged in as ${client.user.username}`, index + 1);

        state.setAccount(index, client.user.username, 'active');
        state.increment('activeAccounts');
        saveTokensFile();

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
        return true;
    } catch (err) {
        handleTokenInvalidation(err.message, true);
        return false;
    }
}

async function replaceToken(index, newToken) {
    const accountInfo = state.getAccountMap().get(index);

    if (clientCleanups[index]) {
        clientCleanups[index]();
    }
    if (clients[index]) {
        try {
            clients[index].destroy();
        } catch { }
        clients[index] = null;
    }

    tokens[index] = newToken;

    if (accountInfo && accountInfo.status === 'invalid') {
        state.decrement('invalidTokens');
    }
    state.setAccount(index, 'Reconnecting...', 'pending');
    saveTokensFile();

    const success = await startAccount(index, newToken);

    if (success) {
        successCount++;
        state.increment('replacedTokens');
    }
}

tokenWatcher.on('tokenChanged', ({ index, oldToken, newToken }) => {
    const accountInfo = state.getAccountMap().get(index);

    if (accountInfo && accountInfo.status === 'invalid') {
        replaceToken(index, newToken).catch(err => {
            Logger.error(`Failed to replace token on line ${index + 1}: ${err.message}`, index + 1);
        });
    } else if (accountInfo && accountInfo.status === 'active') {
        Logger.warning(`Token on line ${index + 1} changed but account is active. Skipping replacement.`, index + 1);
        tokenWatcher.updateToken(index, newToken);
    } else {
        replaceToken(index, newToken).catch(err => {
            Logger.error(`Failed to replace token on line ${index + 1}: ${err.message}`, index + 1);
        });
    }
});

tokenWatcher.on('tokenAdded', ({ index, token }) => {
    tokens.push(token);
    totalCount = tokens.length;
    state.set('totalAccounts', totalCount);

    startAccount(index, token).then(success => {
        if (success) {
            successCount++;
        }
        saveTokensFile();
    }).catch(() => {

    });
});

tokenWatcher.on('tokenRemoved', ({ index }) => {
    if (clientCleanups[index]) {
        clientCleanups[index]();
        clientCleanups[index] = null;
    }
    if (clients[index]) {
        try {
            clients[index].destroy();
        } catch { }
        clients[index] = null;
    }

    const accountInfo = state.getAccountMap().get(index);
    if (accountInfo && accountInfo.status === 'active') {
        state.decrement('activeAccounts');
    } else if (accountInfo && accountInfo.status === 'invalid') {
        state.decrement('invalidTokens');
    }

    tokens.splice(index, 1);
    clients.splice(index, 1);
    clientCleanups.splice(index, 1);
    totalCount = tokens.length;
    state.set('totalAccounts', totalCount);

    state.getAccountMap().delete(index);
    Logger.info(`Account at position ${index + 1} removed.`, index + 1);
    saveTokensFile();
});

(async () => {
    Logger.info(`Starting login for ${totalCount} accounts...`);

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        const success = await startAccount(index, token);
        if (success) {
            successCount++;
        }
    }

    Logger.info(`${successCount}/${totalCount} accounts successfully logged in.`);

    tokenWatcher.start(tokensPath, tokens);
})();