'use strict';

const state = require('./state');
const terminal = require('./terminal');
const { ANSI, COLORS } = require('./terminal');

const BOX = {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    teeLeft: '╠',
    teeRight: '╣',
    singleH: '─',
    cross: '┼',
    singleV: '│',
    singleTeeLeft: '╟',
    singleTeeRight: '╢',
};

class Dashboard {
    constructor() {
        this._lastRenderedLines = [];
        this._renderTimer = null;
        this._renderInterval = null;
        this._throttleMs = 250;
        this._stateChangeHandler = null;
        this._resizeHandler = null;
        this._initialized = false;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        this._stateChangeHandler = () => {
            this._scheduleRender();
        };
        state.on('change', this._stateChangeHandler);

        this._resizeHandler = () => {
            this._lastRenderedLines = [];
            this._scheduleRender();
        };
        terminal.on('resize', this._resizeHandler);

        this._renderInterval = setInterval(() => {
            this._render();
        }, 1000);

        this._render();
    }

    _scheduleRender() {
        if (this._renderTimer) return;
        this._renderTimer = setTimeout(() => {
            this._renderTimer = null;
            this._render();
        }, this._throttleMs);
    }

    _render() {
        const snap = state.snapshot();
        const dims = terminal.getDimensions();
        const width = Math.max(50, dims.cols);

        const lines = this._buildLines(snap, width);

        let hasChanges = false;
        const changedIndices = [];

        for (let i = 0; i < lines.length; i++) {
            if (this._lastRenderedLines[i] !== lines[i]) {
                changedIndices.push(i);
                hasChanges = true;
            }
        }

        if (!hasChanges && this._lastRenderedLines.length === lines.length) {
            return;
        }

        if (this._lastRenderedLines.length !== lines.length) {
            terminal.renderDashboard(lines);
        } else {
            for (const idx of changedIndices) {
                terminal.writeDashboardLine(idx, lines[idx]);
            }
        }

        this._lastRenderedLines = lines;
    }

    _buildLines(snap, width) {
        const innerWidth = width - 2;
        const halfWidth = Math.floor(innerWidth / 2);

        const statusDot = snap.isPaused
            ? `${COLORS.paused}⏸ PAUSED`
            : `${COLORS.live}● LIVE`;

        const lines = [];

        lines.push(
            `${COLORS.border}${BOX.topLeft}${BOX.horizontal.repeat(innerWidth)}${BOX.topRight}${COLORS.reset}`
        );

        const titleText = '● DASHBOARD';
        const uptimeText = `▲ ${snap.uptime}`;
        const titleFormatted = `${COLORS.title}${ANSI.bold}  ${titleText}`;
        const uptimeFormatted = `${COLORS.accent}${uptimeText}  `;

        const titleVisLen = 2 + titleText.length;
        const uptimeVisLen = uptimeText.length + 2;
        const headerPad = innerWidth - titleVisLen - uptimeVisLen;

        lines.push(
            `${COLORS.border}${BOX.vertical}${titleFormatted}${' '.repeat(Math.max(0, headerPad))}${uptimeFormatted}${COLORS.reset}${COLORS.border}${BOX.vertical}${COLORS.reset}`
        );

        lines.push(
            `${COLORS.border}${BOX.singleTeeLeft}${BOX.singleH.repeat(innerWidth)}${BOX.singleTeeRight}${COLORS.reset}`
        );

        lines.push(this._buildDataRow(
            'Active Accounts', `${this._fmt(snap.activeAccounts)}/${this._fmt(snap.totalAccounts)}`,
            'Rate Limits', this._fmt(snap.rateLimits),
            innerWidth
        ));

        lines.push(this._buildDataRow(
            'Invalid Tokens', this._fmt(snap.invalidTokens),
            'Commands', this._fmt(snap.commandsUsed),
            innerWidth
        ));

        lines.push(this._buildDataRow(
            'Messages Sent', this._fmt(snap.messagesSent),
            'Channels', this._fmt(snap.activeChannels),
            innerWidth
        ));

        lines.push(
            `${COLORS.border}${BOX.singleTeeLeft}${BOX.singleH.repeat(innerWidth)}${BOX.singleTeeRight}${COLORS.reset}`
        );

        const memText = `Memory: ${snap.memoryMB} MB`;
        const statusText = snap.isPaused ? '⏸ PAUSED' : '● LIVE';

        const footerLeft = `  ${COLORS.label}${memText}`;
        const footerRight = `${statusDot}  `;

        const footerLeftVisLen = 2 + memText.length;
        const footerRightVisLen = statusText.length + 2;
        const footerPad = innerWidth - footerLeftVisLen - footerRightVisLen;

        lines.push(
            `${COLORS.border}${BOX.vertical}${footerLeft}${' '.repeat(Math.max(0, footerPad))}${footerRight}${COLORS.reset}${COLORS.border}${BOX.vertical}${COLORS.reset}`
        );

        lines.push(
            `${COLORS.border}${BOX.bottomLeft}${BOX.horizontal.repeat(innerWidth)}${BOX.bottomRight}${COLORS.reset}`
        );

        lines.push('');

        return lines;
    }

    _buildDataRow(label1, value1, label2, value2, innerWidth) {
        const col1Width = Math.floor(innerWidth / 2);
        const col2Width = innerWidth - col1Width;

        const left = this._buildCell(label1, value1, col1Width);
        const right = this._buildCell(label2, value2, col2Width);

        return `${COLORS.border}${BOX.vertical}${left}${right}${COLORS.border}${BOX.vertical}${COLORS.reset}`;
    }

    _buildCell(label, value, cellWidth) {
        const labelPad = 18;
        const paddedLabel = label.padEnd(labelPad);
        const valStr = String(value);

        const content = `  ${paddedLabel}${COLORS.dimmed}${BOX.singleV} ${COLORS.value}${valStr}`;
        const visLen = 2 + labelPad + 2 + valStr.length;
        const pad = Math.max(0, cellWidth - visLen);

        return `${COLORS.label}${content}${' '.repeat(pad)}`;
    }

    _fmt(n) {
        if (typeof n !== 'number') return String(n);
        return n.toLocaleString('en-US');
    }

    destroy() {
        if (!this._initialized) return;
        this._initialized = false;

        if (this._renderTimer) {
            clearTimeout(this._renderTimer);
            this._renderTimer = null;
        }

        if (this._renderInterval) {
            clearInterval(this._renderInterval);
            this._renderInterval = null;
        }

        if (this._stateChangeHandler) {
            state.removeListener('change', this._stateChangeHandler);
            this._stateChangeHandler = null;
        }

        if (this._resizeHandler) {
            terminal.removeListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        this._lastRenderedLines = [];
    }
}

module.exports = new Dashboard();