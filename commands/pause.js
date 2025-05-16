module.exports = {
    name: 'pause',
    async execute({ message, client, isPaused, setPaused }) {
        if (isPaused) {
            await message.reply('⏸️ Message sending is already paused.');
        } else {
            setPaused(true);
            await message.reply('✅ Message sending has been paused.');
        }
    }
};
