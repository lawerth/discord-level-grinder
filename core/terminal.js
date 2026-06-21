'use strict';

const blessed = require('blessed');
const contrib = require('blessed-contrib');
const { EventEmitter } = require('events');

const ANSI = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    rgb: (r, g, b) => `\x1b[38;2;${r};${g};${b}m`,
};

const COLORS = {
    success: ANSI.rgb(80, 250, 123),
    error: ANSI.rgb(255, 85, 85),
    warning: ANSI.rgb(255, 200, 60),
    info: ANSI.rgb(100, 180, 255),
    command: ANSI.rgb(200, 130, 255),
    debug: ANSI.rgb(150, 150, 150),
    border: ANSI.rgb(100, 100, 120),
    label: ANSI.rgb(180, 180, 200),
    value: ANSI.rgb(255, 255, 255),
    title: ANSI.rgb(130, 200, 255),
    accent: ANSI.rgb(80, 250, 123),
    dimmed: ANSI.rgb(90, 90, 110),
    live: ANSI.rgb(80, 250, 123),
    paused: ANSI.rgb(255, 200, 60),
    timestamp: ANSI.rgb(110, 110, 140),
    white: ANSI.rgb(220, 220, 230),
    reset: ANSI.reset,
};

const THEME = {
    background: 'black',
    foreground: 'white',
    border: 'cyan',
    accent: 'cyan',
    success: 'green',
};

class Terminal extends EventEmitter {
    constructor() {
        super();
        this._screen = null;
        this._grid = null;
        this._logPanel = null;
        this._cpuGauge = null;
        this._ramGauge = null;
        this._statsPanel = null;
        this._initialized = false;
        this._logs = [];
        this._maxLogs = 500;
        this._lastDashboard = null;
        this._renderScheduled = false;
        this._autoScroll = true;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        this._screen = blessed.screen({
            smartCSR: true,
            fullUnicode: true,
            dockBorders: true,
            title: 'Discord Level Grinder Dashboard',
        });

        this._screen.key(['q', 'Q', 'C-c'], () => {
            if (process.listenerCount('SIGINT') > 0) {
                process.emit('SIGINT');
                return;
            }

            process.exit(0);
        });

        this._screen.on('resize', () => {
            this.emit('resize', this._screen.height, this._screen.width);
            this.updateDashboard(this._lastDashboard);
        });

        this._buildLayout();
        if (this._logs.length === 0) {
            this._renderSeedLogs();
        } else {
            this._replayBufferedLogs();
        }
        this._screen.render();
    }

    _buildLayout() {
        this._grid = new contrib.grid({
            rows: 12,
            cols: 12,
            screen: this._screen,
        });

        this._logPanel = this._grid.set(0, 0, 8, 8, contrib.log, {
            label: ' Live Logs ',
            tags: true,
            bufferLength: this._maxLogs,
            keys: true,
            mouse: true,
            scrollable: true,
            alwaysScroll: true,
            scrollbar: {
                ch: ' ',
                track: { bg: THEME.background },
                style: { bg: THEME.accent },
            },
            border: { type: 'line', fg: THEME.border },
            style: {
                bg: THEME.background,
                fg: THEME.foreground,
                border: { fg: THEME.border },
                label: { fg: THEME.foreground, bold: true },
            },
        });

        this._logPanel.on('scroll', () => {
            this._updateAutoScroll();
        });

        this._logPanel.on('wheeldown', () => {
            this._updateAutoScroll();
        });

        this._logPanel.on('wheelup', () => {
            this._autoScroll = false;
            this._updateLogLabel();
            this._requestRender();
        });

        this._logPanel.key(['up', 'k'], () => {
            this._logPanel.scroll(-1);
            this._autoScroll = false;
            this._updateLogLabel();
            this._requestRender();
        });

        this._logPanel.key(['down', 'j'], () => {
            this._logPanel.scroll(1);
            this._updateAutoScroll();
        });

        this._logPanel.key(['pageup'], () => {
            const scrollAmount = Math.max(1, (this._logPanel.height || 10) - 2);
            this._logPanel.scroll(-scrollAmount);
            this._autoScroll = false;
            this._updateLogLabel();
            this._requestRender();
        });

        this._logPanel.key(['pagedown'], () => {
            const scrollAmount = Math.max(1, (this._logPanel.height || 10) - 2);
            this._logPanel.scroll(scrollAmount);
            this._updateAutoScroll();
        });

        this._logPanel.key(['home'], () => {
            this._logPanel.setScrollPerc(0);
            this._autoScroll = false;
            this._updateLogLabel();
            this._requestRender();
        });

        this._logPanel.key(['end'], () => {
            this._logPanel.setScrollPerc(100);
            this._autoScroll = true;
            this._updateLogLabel();
            this._requestRender();
        });

        this._logPanel.focus();

        this._cpuGauge = this._grid.set(0, 8, 4, 4, blessed.box, {
            label: ' CPU Usage ',
            tags: true,
            padding: {
                left: 1,
                right: 1,
            },
            border: { type: 'line', fg: THEME.border },
            style: {
                bg: THEME.background,
                fg: THEME.foreground,
                border: { fg: THEME.border },
                label: { fg: THEME.foreground, bold: true },
            },
        });

        this._ramGauge = this._grid.set(4, 8, 4, 4, blessed.box, {
            label: ' RAM Usage ',
            tags: true,
            padding: {
                left: 1,
                right: 1,
            },
            border: { type: 'line', fg: THEME.border },
            style: {
                bg: THEME.background,
                fg: THEME.foreground,
                border: { fg: THEME.border },
                label: { fg: THEME.foreground, bold: true },
            },
        });

        this._statsPanel = this._grid.set(8, 0, 4, 12, blessed.box, {
            label: ' Statistics ',
            tags: true,
            padding: {
                right: 2,
                left: 2,
            },
            border: { type: 'line', fg: THEME.border },
            style: {
                bg: THEME.background,
                fg: THEME.foreground,
                border: { fg: THEME.border },
                label: { fg: THEME.foreground, bold: true },
            },
        });
    }

    _renderSeedLogs() {
        const now = Date.now();
        const seedLines = [
            `{gray-fg}${this._formatTime(now - 2000)}{/} {cyan-fg}[INFO]{/} Dashboard initialized`,
            `{gray-fg}${this._formatTime(now - 1000)}{/} {green-fg}[SUCCESS]{/} Runtime monitors online`,
            `{gray-fg}${this._formatTime(now)}{/} {cyan-fg}[INFO]{/} Waiting for account activity`,
        ];

        for (const line of seedLines) {
            this._appendLogLine(line);
        }
    }

    _replayBufferedLogs() {
        for (const line of this._logs.slice(-this._maxLogs)) {
            this._logPanel.log(line);
        }
    }

    writeLog(line) {
        if (!line) return;

        const formatted = this._convertAnsiToBlessed(String(line));
        this._appendLogLine(formatted);
    }

    _appendLogLine(line) {
        this._logs.push(line);
        if (this._logs.length > this._maxLogs) {
            this._logs.shift();
        }

        if (!this._initialized || !this._logPanel) return;

        this._logPanel.log(line);

        if (!this._autoScroll) {
            const scrollHeight = this._logPanel.getScrollHeight();
            const visibleHeight = this._logPanel.height - 2;
            const targetScroll = Math.max(0, scrollHeight - visibleHeight - 1);
            this._logPanel.scrollTo(targetScroll);
        }

        this._requestRender();
    }

    updateDashboard(data) {
        if (!this._initialized || !data) return;

        this._lastDashboard = data;
        this._setGaugeContent(this._cpuGauge, 'CPU', data.cpuPercent, 'green');
        this._setGaugeContent(this._ramGauge, 'RAM', data.ramPercent, 'cyan', data.ramDetail);
        this._statsPanel.setContent(this._formatStats(data.statistics));
        this._requestRender();
    }

    renderDashboard(lines) {
        if (!this._initialized || !Array.isArray(lines)) return;

        this._statsPanel.setContent(lines.map(line => this._convertAnsiToBlessed(line)).join('\n'));
        this._requestRender();
    }

    writeDashboardLine(_lineIndex, _content) {
        if (!this._lastDashboard) return;
        this.updateDashboard(this._lastDashboard);
    }

    clearDashboardArea() {
        if (!this._initialized) return;
        this._statsPanel.setContent('');
        this._requestRender();
    }

    getDimensions() {
        if (!this._screen) {
            return {
                rows: process.stdout.rows || 24,
                cols: process.stdout.columns || 80,
            };
        }

        return {
            rows: this._screen.height,
            cols: this._screen.width,
        };
    }

    _formatStats(stats = {}) {
        const rows = [
            ['Active Accounts', stats.activeAccounts || '99/99'],
            ['Messages Sent', stats.messagesSent || '100'],
            ['Working Time', stats.workingTime || '5 days 6 hours'],
        ];

        const panelHeight = typeof this._statsPanel?.height === 'number'
            ? this._statsPanel.height
            : 4;
        const contentRows = Math.max(1, panelHeight - 2);
        if (contentRows < rows.length) {
            return rows
                .map(([label, value]) => `{gray-fg}${label}:{/} {cyan-fg}{bold}${value}{/}`)
                .join('  ');
        }

        return rows
            .map(([label, value]) => `{gray-fg}${`${label}:`.padEnd(17)}{/} {cyan-fg}{bold}${value}{/}`)
            .join('\n');
    }

    _setGaugeContent(gauge, label, value, color, detail = '') {
        if (!gauge) return;

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            gauge.setContent(`{${color}-fg}${label} ${detail}{/}`);
            return;
        }

        const percent = Math.max(0, Math.min(100, Math.round(numericValue)));
        const gaugeWidth = typeof gauge.width === 'number'
            ? gauge.width
            : Math.floor((this._screen?.width || 90) / 3);
        const contentWidth = Math.max(12, gaugeWidth - 10);
        const detailText = detail ? ` ${detail}` : '';
        const prefix = `${label} ${String(percent).padStart(3)}%${detailText}`;
        const barWidth = Math.min(30, Math.max(6, contentWidth - prefix.length - 3));
        const filledWidth = Math.round((barWidth * percent) / 100);
        const emptyWidth = barWidth - filledWidth;
        const bar = `${'#'.repeat(filledWidth)}${'-'.repeat(emptyWidth)}`;
        const line = `{${color}-fg}${prefix}{/} [${bar}]`;

        gauge.setContent(line);
    }

    _updateAutoScroll() {
        if (!this._logPanel) return;

        const scrollHeight = this._logPanel.getScrollHeight();
        const visibleHeight = this._logPanel.height - 2;
        const currentScroll = this._logPanel.getScroll();
        const maxScroll = Math.max(0, scrollHeight - visibleHeight);

        this._autoScroll = currentScroll >= maxScroll - 1;
        this._updateLogLabel();
        this._requestRender();
    }

    _updateLogLabel() {
        if (!this._logPanel) return;

        if (this._autoScroll) {
            this._logPanel.setLabel(' Live Logs ');
        } else {
            this._logPanel.setLabel(' Live Logs {yellow-fg}(Scrolled ↑ — Press End to resume){/} ');
        }
    }

    _requestRender() {
        if (!this._initialized || !this._screen || this._renderScheduled) return;

        this._renderScheduled = true;
        setImmediate(() => {
            this._renderScheduled = false;

            if (this._initialized && this._screen) {
                this._screen.render();
            }
        });
    }

    _formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }

    _convertAnsiToBlessed(str) {
        return str
            .replace(/\x1b\[38;2;(\d+);(\d+);(\d+)m/g, (_match, r, g, b) => {
                const hex = [r, g, b]
                    .map(channel => Number(channel).toString(16).padStart(2, '0'))
                    .join('');
                return `{#${hex}-fg}`;
            })
            .replace(/\x1b\[1m/g, '{bold}')
            .replace(/\x1b\[2m/g, '{gray-fg}')
            .replace(/\x1b\[0m/g, '{/}')
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    }

    cleanup() {
        if (!this._initialized) return;
        this._initialized = false;

        if (this._screen) {
            this._screen.destroy();
            this._screen = null;
        }

        this._grid = null;
        this._logPanel = null;
        this._cpuGauge = null;
        this._ramGauge = null;
        this._statsPanel = null;
        this._renderScheduled = false;
    }
}

const terminal = new Terminal();

module.exports = terminal;
module.exports.ANSI = ANSI;
module.exports.COLORS = COLORS;
