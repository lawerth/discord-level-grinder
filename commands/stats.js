module.exports = {
    name: 'stats',
    async execute({ message, messageCount, lastChannelID, lastMessageTime }) {
        const time = lastMessageTime
            ? `<t:${Math.floor(lastMessageTime / 1000)}:R>`
            : 'No messages sent yet.';

        const channelDisplay = lastChannelID
            ? `<#${lastChannelID}>`
            : 'N/A';

        await message.reply(
            `📊 **Statistics**\n` +
            `Total messages: ${messageCount}\n` +
            `Last channel: ${channelDisplay}\n` +
            `Last message: ${time}`
        );
    }
};
