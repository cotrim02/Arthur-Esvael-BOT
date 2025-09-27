// funcionalidades/shh.js
async function shhCommand(client, message) {
    try {
        const chat = await message.getChat();

        if (!chat.isGroup && !chat.isUser) {
            await message.reply('Comando só pode ser usado em grupos ou chats pessoais.');
            return;
        }

        if (chat.isGroup) {
            await chat.loadParticipants();
            const me = await client.getMe();
            const meParticipant = chat.participants.find(p => p.id._serialized === me._serialized);
            const isAdmin = meParticipant && (meParticipant.isAdmin || meParticipant.isSuperAdmin);
            if (!isAdmin) {
                await message.reply('Preciso ser administrador para apagar mensagens neste grupo.');
                return;
            }
        }

        const messages = await chat.fetchMessages({ limit: 11 });
        const messagesToDelete = messages.filter(m => m.id._serialized !== message.id._serialized).slice(0, 10);

        for (const msg of messagesToDelete) {
            try {
                await msg.delete(true);
            } catch (err) {
                console.error(`Erro ao apagar msg ${msg.id._serialized}:`, err.message);
            }
        }

        await message.reply('🧹 Últimas 10 mensagens apagadas com sucesso!');
    } catch (err) {
        console.error('Erro no comando /shh:', err);
        await message.reply('❌ Não foi possível apagar as mensagens.');
    }
}

module.exports = { shhCommand };
