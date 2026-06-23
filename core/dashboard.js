'use strict';

const os = require('os');
const state = require('./state');
const terminal = require('./terminal');
const networkMonitor = require('./network');

class Dashboard {
    constructor() {
        this._refreshTimer = null;
        this._stateChangeHandler = null;
        this._resizeHandler = null;
        this._initialized = false;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        this._stateChangeHandler = () => this._render();
        this._resizeHandler = () => this._render();

        state.on('change', this._stateChangeHandler);
        terminal.on('resize', this._resizeHandler);

        this._refreshTimer = setInterval(() => {
            this._render();
        }, 1000);

        this._render();
    }

    _render() {
        const snap = state.snapshot();
        const ram = this._getRamUsage();

        terminal.updateDashboard({
            ramPercent: null,
            ramDetail: this._formatBytes(ram.used),
            statistics: this._getStatistics(snap),
        });
    }

    _getStatistics(snap) {
        return {
            activeAccounts: `${this._formatNumber(snap.activeAccounts)}/${this._formatNumber(snap.totalAccounts)}`,
            messagesSent: this._formatNumber(snap.messagesSent),
            workingTime: this._formatWorkingTime(state.getUptime()),
            networkStatus: networkMonitor.online,
            invalidTokens: snap.invalidTokens,
            invalidAccounts: snap.invalidAccounts || [],
        };
    }

    _getRamUsage() {
        const used = process.memoryUsage().rss;

        return {
            used,
        };
    }

    _formatWorkingTime(totalSeconds) {
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const parts = [
            [days, 'day'],
            [hours, 'hour'],
            [minutes, 'minute'],
            [seconds, 'second'],
        ]
            .filter(([value]) => value > 0)
            .map(([value, unit]) => `${value} ${value === 1 ? unit : `${unit}s`}`);

        return parts.length > 0 ? parts.join(' ') : 'less than 1 second';
    }

    _formatNumber(value) {
        if (typeof value !== 'number') return String(value);
        return value.toLocaleString('en-US');
    }

    _formatBytes(bytes) {
        const gb = bytes / 1024 / 1024 / 1024;

        if (gb >= 1) {
            return `${gb.toFixed(1)} GB`;
        }

        return `${Math.round(bytes / 1024 / 1024)} MB`;
    }

    _clampPercent(value) {
        return Math.max(0, Math.min(100, Math.round(value)));
    }

    destroy() {
        if (!this._initialized) return;
        this._initialized = false;

        if (this._refreshTimer) {
            clearInterval(this._refreshTimer);
            this._refreshTimer = null;
        }

        if (this._stateChangeHandler) {
            state.removeListener('change', this._stateChangeHandler);
            this._stateChangeHandler = null;
        }

        if (this._resizeHandler) {
            terminal.removeListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }
    }
}

module.exports = new Dashboard();
