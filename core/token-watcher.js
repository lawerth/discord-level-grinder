'use strict';

const fs = require('fs');
const { EventEmitter } = require('events');
const Logger = require('./logger');

class TokenWatcher extends EventEmitter {
    constructor() {
        super();
        this._tokensPath = null;
        this._currentTokens = [];
        this._watching = false;
        this._lastWrittenContent = null;
        this._pollIntervalMs = 3_000;
    }

    /**
     * Start watching the tokens file for changes.
     * @param {string} tokensPath - Absolute path to tokens.txt
     * @param {string[]} initialTokens - The tokens array loaded at startup
     */
    start(tokensPath, initialTokens) {
        if (this._watching) return;
        this._watching = true;
        this._tokensPath = tokensPath;
        this._currentTokens = [...initialTokens];

        fs.watchFile(this._tokensPath, { interval: this._pollIntervalMs }, () => {
            this._onFileChange();
        });
    }

    stop() {
        if (!this._watching) return;
        this._watching = false;

        if (this._tokensPath) {
            fs.unwatchFile(this._tokensPath);
        }
    }

    /**
     * Parse tokens from file content (same logic as index.js, including empty-line filter).
     * @param {string} content - Raw file content
     * @returns {string[]} Array of cleaned, non-empty tokens
     */
    _parseTokens(content) {
        return content
            .split(/\r?\n/)
            .map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('#') || trimmed.length === 0) return '';
                const hashIdx = trimmed.indexOf('#');
                let clean = hashIdx !== -1 ? trimmed.substring(0, hashIdx) : trimmed;
                clean = clean.trim();
                if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
                    clean = clean.slice(1, -1).trim();
                }
                return clean;
            })
            .filter(t => t.length > 0);
    }

    _onFileChange() {
        let content;
        try {
            content = fs.readFileSync(this._tokensPath, 'utf8');
        } catch (err) {
            Logger.error(`Failed to read tokens file: ${err.message}`);
            return;
        }

        if (this._lastWrittenContent !== null && content === this._lastWrittenContent) {
            this._lastWrittenContent = null;
            return;
        }
        this._lastWrittenContent = null;

        const newParsed = this._parseTokens(content);
        const oldTokens = this._currentTokens;

        const maxIndex = Math.min(oldTokens.length, newParsed.length);

        for (let i = 0; i < maxIndex; i++) {
            const oldToken = oldTokens[i];
            const newToken = newParsed[i];

            if (oldToken !== newToken) {
                Logger.info(`Token change detected at position ${i + 1}. Attempting login with new token...`, i + 1);
                this._currentTokens[i] = newToken;
                this.emit('tokenChanged', { index: i, oldToken, newToken });
            }
        }

        if (newParsed.length > oldTokens.length) {
            for (let i = oldTokens.length; i < newParsed.length; i++) {
                Logger.info(`New token detected at position ${i + 1}. Starting login...`, i + 1);
                this._currentTokens.push(newParsed[i]);
                this.emit('tokenAdded', { index: i, token: newParsed[i] });
            }
        }

        if (newParsed.length < oldTokens.length) {
            const removedIndices = [];
            for (let i = oldTokens.length - 1; i >= newParsed.length; i--) {
                Logger.info(`Token removed at position ${i + 1}. Stopping account...`, i + 1);
                removedIndices.push(i);
            }
            this._currentTokens.length = newParsed.length;
            this.emit('tokensRemoved', { indices: removedIndices });
        }
    }

    /**
     * Write the tokens file with usernames as inline comments.
     * Preserves standalone comment lines and blank lines from the original file.
     * Stores written content to prevent the watcher from re-processing our own writes.
     * @param {string[]} tokensList - Array of tokens
     * @param {Map} accountMap - state account map (index -> { username, status })
     * @param {string} [filePath] - Optional fallback path if _tokensPath is not set yet
     */
    writeTokensFile(tokensList, accountMap, filePath) {
        const targetPath = this._tokensPath || filePath;
        if (!targetPath) return;

        let existingLines = [];
        try {
            const content = fs.readFileSync(targetPath, 'utf8');
            existingLines = content.split(/\r?\n/);
        } catch {
        }

        const updatedTokenLines = tokensList.map((token, i) => {
            const info = accountMap.get(i);
            if (info && info.username && info.username !== 'Unknown' && info.username !== 'Reconnecting...') {
                return `${token} #${info.username}`;
            }
            return token;
        });

        const finalLines = [];
        let tokenIdx = 0;

        for (let i = 0; i < existingLines.length; i++) {
            const trimmed = existingLines[i].trim();

            if (trimmed.length === 0 || trimmed.startsWith('#')) {
                finalLines.push(existingLines[i]);
            } else {
                if (tokenIdx < updatedTokenLines.length) {
                    finalLines.push(updatedTokenLines[tokenIdx]);
                    tokenIdx++;
                }
            }
        }

        while (tokenIdx < updatedTokenLines.length) {
            finalLines.push(updatedTokenLines[tokenIdx]);
            tokenIdx++;
        }

        const finalContent = finalLines.join('\n');

        try {
            this._lastWrittenContent = finalContent;
            fs.writeFileSync(targetPath, finalContent, 'utf8');
        } catch (err) {
            Logger.error(`Failed to write tokens file: ${err.message}`);
            this._lastWrittenContent = null;
        }
    }

    /**
     * Update the internal token at a specific index.
     * @param {number} index
     * @param {string} token
     */
    updateToken(index, token) {
        if (index >= 0 && index < this._currentTokens.length) {
            this._currentTokens[index] = token;
        }
    }

    /**
     * Get the current token list.
     * @returns {string[]}
     */
    getTokens() {
        return [...this._currentTokens];
    }
}

module.exports = new TokenWatcher();
