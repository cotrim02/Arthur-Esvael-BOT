module.exports = async (client, message) => {
    const grupoCornosID = '120363380398336548@g.us';

    // Comando /cornos em grupo
    if (message.body === '/cornos' && message.from.endsWith('@g.us')) {
        const chats = await client.getChats();
        const grupo = chats.find(chat => chat.isGroup && chat.id._serialized === message.from);

        if (!grupo) {
            return await message.reply('Grupo não encontrado.');
        }

        const mentions = grupo.participants.map(p => p.id._serialized);

        await client.sendMessage(grupo.id._serialized, '⚠️ ACORDEM CORNOS ⚠️', {
            mentions
        });

        return;
    }

    // Comando /cornos no privado
    if (message.body === '/cornos' && !message.from.endsWith('@g.us')) {
        try {
            const chats = await client.getChats();
            const grupoCornos = chats.find(chat => chat.isGroup && chat.id._serialized === grupoCornosID);

            if (!grupoCornos) {
                return await message.reply('❌ Grupo dos cornos não encontrado.');
            }

            const mentions = grupoCornos.participants.map(p => p.id._serialized);

            await client.sendMessage(grupoCornos.id._serialized, '🔔⚠️ ACORDEM CORNOS ⚠️🔔', {
                mentions
            });

            return await message.reply('✅ Mensagem enviada com sucesso no grupo dos cornos!');
        } catch (err) {
            console.error('Erro ao enviar mensagem no grupo dos cornos:', err);
            return await message.reply('❌ Ocorreu um erro ao tentar enviar no grupo.');
        }
    }

    // Comando /pix em grupo
    if (message.body === '/pix' && message.from.endsWith('@g.us')) {
        const chats = await client.getChats();
        const grupo = chats.find(chat => chat.isGroup && chat.id._serialized === message.from);

        if (!grupo) {
            return await message.reply('Grupo não encontrado.');
        }

        const mentions = grupo.participants.map(p => p.id._serialized);

     await client.sendMessage(grupo.id._serialized,
`
🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑
🛑MANDEM PIX IMEDIATAMENTE ! 🛑
🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑🛑`, {
    mentions
});

        return;
    }

    // Comando /pix no privado
    if (message.body === '/pix' && !message.from.endsWith('@g.us')) {
        try {
            const chats = await client.getChats();
            const grupoCornos = chats.find(chat => chat.isGroup && chat.id._serialized === grupoCornosID);

            if (!grupoCornos) {
                return await message.reply('❌ Grupo dos cornos não encontrado.');
            }

            const mentions = grupoCornos.participants.map(p => p.id._serialized);

            await client.sendMessage(grupoCornos.id._serialized, '📲💸 MANDEM PIX IMEDIATAMENTE 💸📲', {
                mentions
            });

            return await message.reply('✅ PIX cobrado com sucesso no grupo dos cornos!');
        } catch (err) {
            console.error('Erro ao enviar mensagem no grupo dos cornos:', err);
            return await message.reply('❌ Ocorreu um erro ao tentar enviar no grupo.');
        }
    }
};
