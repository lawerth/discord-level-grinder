module.exports = {
    name: 'stats',
    async execute({ message, messageCount, lastChannelID, lastMessageTime, specialMessages }) {
        const time = lastMessageTime
            ? `<t:${Math.floor(lastMessageTime / 1000)}:R>`
            : 'No messages sent yet.';

        const channelDisplay = lastChannelID
            ? `<#${lastChannelID}>`
            : 'N/A';

        let specialStats = 'No special messages configured.';
        if (Array.isArray(specialMessages) && specialMessages.length > 0) {
            const total = specialMessages.length;
            const completed = specialMessages.filter(m => m.sentCount >= m.count).length;
            specialStats = `${completed}/${total} sent completely.`;
        }

        await message.reply(
            `📊 **Statistics**\n` +
            `Total messages: ${messageCount}\n` +
            `Last channel: ${channelDisplay}\n` +
            `Last message: ${time}\n` +
            `Special messages: ${specialStats}`
        );
    }
};
