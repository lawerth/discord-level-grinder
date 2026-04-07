const chalk = require('chalk');

class Logger {
    static info(message, prefix = '[INFO]') {
        console.log(chalk.blue(prefix), chalk.white(message));
    }

    static success(message, prefix = '[SUCCESS]') {
        console.log(chalk.green(prefix), chalk.white(message));
    }

    static error(message, prefix = '[ERROR]') {
        console.log(chalk.red(prefix), chalk.white(message));
    }

    static warning(message, prefix = '[WARNING]') {
        console.log(chalk.yellow(prefix), chalk.white(message));
    }

    static debug(message, prefix = '[DEBUG]') {
        console.log(chalk.magenta(prefix), chalk.white(message));
    }

    static log(message, color = 'white', prefix = '[LOG]') {
        console.log(chalk[color](prefix), chalk.white(message));
    }
}

module.exports = Logger;