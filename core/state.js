'use strict';

const { EventEmitter } = require('events');

class State extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50);

        this._data = {
            activeAccounts: 0,
            totalAccounts: 0,
            invalidTokens: 0,
            messagesSent: 0,
            commandsUsed: 0,
            rateLimits: 0,
            activeChannels: new Set(),
            startTime: Date.now(),
            isPaused: false,
        };
    }

    get(field) {
        return this._data[field];
    }

    set(field, value) {
        const old = this._data[field];
        if (old === value) return;
        this._data[field] = value;
        this.emit('change', field, value);
    }

    increment(field) {
        if (typeof this._data[field] !== 'number') return;
        this._data[field]++;
        this.emit('change', field, this._data[field]);
    }

    decrement(field) {
        if (typeof this._data[field] !== 'number') return;
        this._data[field] = Math.max(0, this._data[field] - 1);
        this.emit('change', field, this._data[field]);
    }

    addChannel(channelId) {
        const prev = this._data.activeChannels.size;
        this._data.activeChannels.add(channelId);
        if (this._data.activeChannels.size !== prev) {
            this.emit('change', 'activeChannels', this._data.activeChannels.size);
        }
    }

    removeChannel(channelId) {
        const prev = this._data.activeChannels.size;
        this._data.activeChannels.delete(channelId);
        if (this._data.activeChannels.size !== prev) {
            this.emit('change', 'activeChannels', this._data.activeChannels.size);
        }
    }

    getUptime() {
        return Math.floor((Date.now() - this._data.startTime) / 1000);
    }

    getFormattedUptime() {
        const totalSec = this.getUptime();
        const h = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const s = String(totalSec % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    getMemoryMB() {
        return Math.round(process.memoryUsage().rss / 1024 / 1024);
    }

    snapshot() {
        return {
            activeAccounts: this._data.activeAccounts,
            totalAccounts: this._data.totalAccounts,
            invalidTokens: this._data.invalidTokens,
            messagesSent: this._data.messagesSent,
            commandsUsed: this._data.commandsUsed,
            rateLimits: this._data.rateLimits,
            activeChannels: this._data.activeChannels.size,
            uptime: this.getFormattedUptime(),
            memoryMB: this.getMemoryMB(),
            isPaused: this._data.isPaused,
        };
    }

    reset() {
        this._data.activeAccounts = 0;
        this._data.invalidTokens = 0;
        this._data.messagesSent = 0;
        this._data.commandsUsed = 0;
        this._data.rateLimits = 0;
        this._data.activeChannels.clear();
        this._data.isPaused = false;
        this.emit('change', '_all', null);
    }
}

module.exports = new State();