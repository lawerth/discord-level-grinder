module.exports = {
    name: 'resume',
    async execute({ message, client, isPaused, setPaused, startTimers }) {
        if (!isPaused) {
            await message.reply('▶️ Message sending is already active.');
        } else {
            setPaused(false);
            startTimers();
            await message.reply('✅ Message sending has been resumed.');
        }
    }
};
