'use strict';

const ANSI = {
    hideCursor: '\x1b[?25l',
    showCursor: '\x1b[?25h',
    saveCursor: '\x1b7',
    restoreCursor: '\x1b8',
    moveTo: (row, col) => `\x1b[${row};${col}H`,
    moveToCol: (col) => `\x1b[${col}G`,
    clearLine: '\x1b[2K',
    clearDown: '\x1b[J',
    clearScreen: '\x1b[2J',
    setScrollRegion: (top, bottom) => `\x1b[${top};${bottom}r`,
    resetScrollRegion: '\x1b[r',
    scrollUp: (n = 1) => `\x1b[${n}S`,
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    rgb: (r, g, b) => `\x1b[38;2;${r};${g};${b}m`,
    bgRgb: (r, g, b) => `\x1b[48;2;${r};${g};${b}m`,
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

class Terminal {
    constructor() {
        this._rows = 0;
        this._cols = 0;
        this._dashboardHeight = 10;
        this._scrollBottom = 0;
        this._initialized = false;
        this._writeBuffer = '';
        this._flushScheduled = false;
        this._resizeHandler = null;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        this._updateDimensions();

        this._resizeHandler = () => {
            this._updateDimensions();
            this.emit('resize', this._rows, this._cols);
        };
        process.stdout.on('resize', this._resizeHandler);

        const buf = ANSI.clearScreen
            + ANSI.hideCursor
            + ANSI.moveTo(1, 1)
            + this._setupScrollRegion();

        process.stdout.write(buf);
    }

    _updateDimensions() {
        this._rows = process.stdout.rows || 24;
        this._cols = process.stdout.columns || 80;
        this._scrollBottom = Math.max(1, this._rows - this._dashboardHeight);
    }

    _setupScrollRegion() {
        return ANSI.setScrollRegion(1, this._scrollBottom);
    }

    reconfigureRegions() {
        this._updateDimensions();
        const buf = this._setupScrollRegion()
            + ANSI.moveTo(this._scrollBottom, 1);
        process.stdout.write(buf);
    }

    writeLog(line) {
        const visibleLen = this._stripAnsi(line).length;
        let output = line;
        if (visibleLen > this._cols) {
            output = this._truncateAnsi(line, this._cols - 1);
        }

        const buf = ANSI.saveCursor
            + ANSI.moveTo(this._scrollBottom, 1)
            + '\n'
            + ANSI.clearLine
            + output
            + ANSI.reset
            + ANSI.restoreCursor;

        process.stdout.write(buf);
    }

    writeDashboardLine(lineIndex, content) {
        const row = this._scrollBottom + 1 + lineIndex;
        if (row > this._rows) return;

        const visibleLen = this._stripAnsi(content).length;
        let output = content;
        if (visibleLen > this._cols) {
            output = this._truncateAnsi(content, this._cols - 1);
        }

        this._writeBuffer += ANSI.moveTo(row, 1) + ANSI.clearLine + output + ANSI.reset;

        if (!this._flushScheduled) {
            this._flushScheduled = true;
            Promise.resolve().then(() => {
                this._flushScheduled = false;
                if (this._writeBuffer.length > 0) {
                    const buf = ANSI.saveCursor
                        + this._writeBuffer
                        + ANSI.restoreCursor;
                    this._writeBuffer = '';
                    process.stdout.write(buf);
                }
            });
        }
    }

    renderDashboard(lines) {
        let buf = ANSI.saveCursor;

        for (let i = 0; i < lines.length; i++) {
            const row = this._scrollBottom + 1 + i;
            if (row > this._rows) break;

            let output = lines[i];
            const visibleLen = this._stripAnsi(output).length;
            if (visibleLen > this._cols) {
                output = this._truncateAnsi(output, this._cols - 1);
            }

            buf += ANSI.moveTo(row, 1) + ANSI.clearLine + output + ANSI.reset;
        }

        buf += ANSI.restoreCursor;
        process.stdout.write(buf);
    }

    _stripAnsi(str) {
        // eslint-disable-next-line no-control-regex
        return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    }

    _truncateAnsi(str, maxLen) {
        let visibleCount = 0;
        let result = '';
        let inEscape = false;

        for (let i = 0; i < str.length; i++) {
            const ch = str[i];

            if (ch === '\x1b') {
                inEscape = true;
                result += ch;
                continue;
            }

            if (inEscape) {
                result += ch;
                if (/[a-zA-Z]/.test(ch)) {
                    inEscape = false;
                }
                continue;
            }

            if (visibleCount >= maxLen) {
                break;
            }

            result += ch;
            visibleCount++;
        }

        return result + ANSI.reset;
    }

    getDimensions() {
        return {
            rows: this._rows,
            cols: this._cols,
            scrollBottom: this._scrollBottom,
            dashboardHeight: this._dashboardHeight,
        };
    }

    cleanup() {
        if (!this._initialized) return;
        this._initialized = false;

        if (this._resizeHandler) {
            process.stdout.removeListener('resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        const buf = ANSI.resetScrollRegion
            + ANSI.showCursor
            + ANSI.moveTo(this._rows, 1)
            + '\n';

        process.stdout.write(buf);
    }
}

const { EventEmitter } = require('events');
const emitterProto = EventEmitter.prototype;
Terminal.prototype.on = emitterProto.on;
Terminal.prototype.off = emitterProto.off;
Terminal.prototype.emit = emitterProto.emit;
Terminal.prototype.removeListener = emitterProto.removeListener;
Terminal.prototype.removeAllListeners = emitterProto.removeAllListeners;

const terminal = new Terminal();
EventEmitter.call(terminal);

module.exports = terminal;
module.exports.ANSI = ANSI;
module.exports.COLORS = COLORS;