'use strict';

const fs = require('fs');
const path = require('path');
const terminal = require('./terminal');
const { COLORS } = require('./terminal');

const LOG_LEVELS = {
    SUCCESS: { label: 'SUCCESS', color: COLORS.success, priority: 0 },
    ERROR: { label: 'ERROR', color: COLORS.error, priority: 1 },
    WARNING: { label: 'WARNING', color: COLORS.warning, priority: 2 },
    INFO: { label: 'INFO', color: COLORS.info, priority: 3 },
    COMMAND: { label: 'COMMAND', color: COLORS.command, priority: 4 },
    DEBUG: { label: 'DEBUG', color: COLORS.debug, priority: 5 },
};

class Logger {
    constructor() {
        this._buffer = [];
        this._maxBufferSize = 1000;
        this._logDir = path.join(process.cwd(), 'logs');
        this._logStream = null;
        this._currentLogDate = null;
        this._fileLoggingEnabled = true;

        this._ensureLogDir();
    }

    _ensureLogDir() {
        try {
            if (!fs.existsSync(this._logDir)) {
                fs.mkdirSync(this._logDir, { recursive: true });
            }
        } catch {
            this._fileLoggingEnabled = false;
        }
    }

    _getLogStream() {
        if (!this._fileLoggingEnabled) return null;

        const today = new Date().toISOString().slice(0, 10);

        if (this._currentLogDate !== today) {
            if (this._logStream) {
                try { this._logStream.end(); } catch { }
            }

            this._currentLogDate = today;
            const filePath = path.join(this._logDir, `${today}.log`);

            try {
                this._logStream = fs.createWriteStream(filePath, { flags: 'a' });
                this._logStream.on('error', () => {
                    this._fileLoggingEnabled = false;
                    this._logStream = null;
                });
            } catch {
                this._fileLoggingEnabled = false;
                this._logStream = null;
            }
        }

        return this._logStream;
    }

    _timestamp() {
        const now = new Date();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    _stripAnsi(str) {
        // eslint-disable-next-line no-control-regex
        return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    }

    _log(level, message, id) {
        const levelDef = LOG_LEVELS[level] || LOG_LEVELS.INFO;
        const ts = this._timestamp();

        const idPart = id !== undefined ? ` ${COLORS.dimmed}[${id}]` : '';
        const formatted = `${COLORS.timestamp}${ts} ${levelDef.color}[${levelDef.label}]${idPart} ${COLORS.white}${message}${COLORS.reset}`;

        this._buffer.push(formatted);
        if (this._buffer.length > this._maxBufferSize) {
            this._buffer.shift();
        }

        terminal.writeLog(formatted);

        const stream = this._getLogStream();
        if (stream) {
            const idPartPlain = id !== undefined ? ` [${id}]` : '';
            const plainLine = `${ts} [${levelDef.label}]${idPartPlain} ${message}\n`;
            stream.write(plainLine);
        }
    }

    success(message, id) {
        this._log('SUCCESS', message, id);
    }

    error(message, id) {
        this._log('ERROR', message, id);
    }

    warning(message, id) {
        this._log('WARNING', message, id);
    }

    info(message, id) {
        this._log('INFO', message, id);
    }

    command(message, id) {
        this._log('COMMAND', message, id);
    }

    debug(message, id) {
        this._log('DEBUG', message, id);
    }

    getBuffer(n) {
        if (n === undefined) return [...this._buffer];
        return this._buffer.slice(-n);
    }

    clearBuffer() {
        this._buffer.length = 0;
    }

    close() {
        if (this._logStream) {
            try { this._logStream.end(); } catch { }
            this._logStream = null;
        }
    }
}

module.exports = new Logger();