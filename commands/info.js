module.exports = {
    name: 'info',
    async execute({ message, isPaused, nextMessageTime }) {
        const status = isPaused ? '⛔ Paused' : '✅ Active';
        const nextTime = nextMessageTime
            ? `<t:${Math.floor(nextMessageTime / 1000)}:R>`
            : 'Not scheduled yet.';

        await message.reply(
            `📋 **Bot Status**\n` +
            `Status: ${status}\n` +
            `Next message: ${nextTime}`
        );
    }
};
