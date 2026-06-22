'use strict';

const { EventEmitter } = require('events');
const https = require('https');
const Logger = require('./logger');

class NetworkMonitor extends EventEmitter {
    constructor() {
        super();
        this._online = true;
        this._offlineSince = null;
        this._probeInterval = null;
        this._probeIntervalMs = 10_000;
        this._healthIntervalMs = 60_000;
        this._probeTimeoutMs = 5_000;
    }

    start() {
        if (this._probeInterval) return;
        this._scheduleProbe();
    }

    stop() {
        if (this._probeInterval) {
            clearTimeout(this._probeInterval);
            this._probeInterval = null;
        }
    }

    get online() {
        return this._online;
    }

    handleError(err) {
        if (!this._isNetworkError(err)) return false;

        if (this._online) {
            this._goOffline();
        }

        return true;
    }

    _isNetworkError(err) {
        if (!err) return false;

        const msg = (err.message || '').toLowerCase();
        const code = String(err.code || '').toLowerCase();

        const networkPatterns = [
            'fetch failed',
            'network error',
            'enotfound',
            'econnrefused',
            'econnreset',
            'econnaborted',
            'etimedout',
            'epipe',
            'ehostunreach',
            'enetunreach',
            'enetdown',
            'socket hang up',
            'getaddrinfo',
            'dns lookup failed',
            'unable to get local issuer certificate',
            'request to https://discord.com',
            'request to https://discordapp.com',
        ];

        return networkPatterns.some(pattern => msg.includes(pattern) || code.includes(pattern));
    }

    _goOffline() {
        this._online = false;
        this._offlineSince = Date.now();

        Logger.warning('Internet connection lost. Message sending paused.');
        this.emit('offline');

        this._scheduleProbe();
    }

    _goOnline() {
        const wasOffline = !this._online;
        this._online = true;

        if (wasOffline) {
            const downtime = this._formatDuration(Date.now() - this._offlineSince);
            this._offlineSince = null;

            Logger.success(`Internet connection restored (was offline for ${downtime}). Resuming message sending.`);
            this.emit('online');
        }

        this._scheduleProbe();
    }

    _scheduleProbe() {
        if (this._probeInterval) {
            clearTimeout(this._probeInterval);
        }

        const interval = this._online ? this._healthIntervalMs : this._probeIntervalMs;

        this._probeInterval = setTimeout(() => {
            this._probe().then(reachable => {
                if (reachable) {
                    this._goOnline();
                } else if (this._online) {
                    this._goOffline();
                }
                this._scheduleProbe();
            });
        }, interval);

        if (this._probeInterval.unref) {
            this._probeInterval.unref();
        }
    }

    _probe() {
        return new Promise(resolve => {
            const req = https.request(
                'https://discord.com/api/v9/gateway',
                { method: 'GET', timeout: this._probeTimeoutMs },
                (res) => {
                    res.resume();
                    resolve(true);
                },
            );

            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });

            req.on('error', () => {
                resolve(false);
            });

            req.end();
        });
    }

    _formatDuration(ms) {
        const totalSec = Math.floor(ms / 1000);
        if (totalSec < 60) return `${totalSec}s`;

        const minutes = Math.floor(totalSec / 60);
        const seconds = totalSec % 60;
        if (minutes < 60) return `${minutes}m ${seconds}s`;

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
}

const networkMonitor = new NetworkMonitor();

module.exports = networkMonitor;
