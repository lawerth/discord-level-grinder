module.exports = {
    name: 'pause',
    async execute({ message, isPaused, setPaused, clearAllTimers }) {
        if (isPaused) {
            await message.reply('⏸️ Message sending is already **paused**.');
        } else {
            setPaused(true);
            clearAllTimers();
            await message.reply('✅ Message sending has been **paused**.');
        }
    }
};
