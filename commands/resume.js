module.exports = {
    name: 'resume',
    async execute({ message, client, isPaused, setPaused }) {
        if (!isPaused) {
            await message.reply('▶️ Message sending is already active.');
        } else {
            setPaused(false);
            await message.reply('✅ Message sending has been resumed.');
        }
    }
};
