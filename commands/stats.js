module.exports = {
    name: 'stats',
    async execute({ message, messageCount, lastChannelID, lastMessageTime, specialSentCount, state }) {
        const snap = state ? state.snapshot() : null;

        const time = lastMessageTime
            ? `<t:${Math.floor(lastMessageTime / 1000)}:R>`
            : 'No messages sent yet.';

        const channelDisplay = lastChannelID
            ? `<#${lastChannelID}>`
            : 'N/A';

        let statsMsg =
            `📊 **Statistics**\n` +
            `Total messages: ${messageCount}\n` +
            `Last channel: ${channelDisplay}\n` +
            `Last message: ${time}`;

        if (snap) {
            statsMsg += `\n\n📈 **Global Stats**\n` +
                `Active accounts: ${snap.activeAccounts}/${snap.totalAccounts}\n` +
                `Invalid tokens: ${snap.invalidTokens}\n` +
                `Global messages: ${snap.messagesSent.toLocaleString()}\n` +
                `Commands used: ${snap.commandsUsed}\n` +
                `Rate limits: ${snap.rateLimits}\n` +
                `Active channels: ${snap.activeChannels}\n` +
                `Uptime: ${snap.uptime}\n` +
                `Memory: ${snap.memoryMB} MB`;
        }

        await message.reply(statsMsg);
    }
};
