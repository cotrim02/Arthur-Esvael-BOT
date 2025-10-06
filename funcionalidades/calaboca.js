const mutedUsers = new Map(); // chave: `${chatId}_${userId}` => timestamp de desbloqueio

const NUMERO_LIBERADO = '5511961911139@c.us'; // Número autorizado (com 55, igual ao senderId do seu log)

/**
 * Verifica se o usuário é admin do grupo
 */
async function isUserAdmin(chat, userId) {
    if (chat.participants instanceof Map) {
        const participant = chat.participants.get(userId);
        return participant ? participant.isAdmin || false : false;
    } else if (Array.isArray(chat.participants)) {
        const participant = chat.participants.find(p => p.id._serialized === userId);
        return participant ? participant.isAdmin || false : false;
    }
    return false;
}

/**
 * Comando para silenciar um usuário: apaga mensagens antigas e bloqueia por X minutos.
 * Sintaxe: /xiu[MINUTOS] @usuario
 */
async function calabocaCommand(client, message) {
    if (!message.from.endsWith('@g.us')) {
        await message.reply('❗ Este comando só funciona em grupos.');
        return;
    }

    let chat;
    try {
        chat = await message.getChat();
    } catch (e) {
        await message.reply('❌ Não consegui acessar o grupo.');
        return;
    }

    // Usa sempre message.author em grupo
    const senderId = message.author;
    // Compatibilidade com LID (novo formato de ID do WhatsApp)
    let senderNumber = senderId;
    if (senderId && senderId.includes('@lid')) {
        try {
            const senderContact = await client.getContactById(senderId);
            senderNumber = senderContact.number ? `${senderContact.number}@c.us` : senderId;
        } catch (e) {
            senderNumber = senderId;
        }
    }
    console.log('SenderId:', senderId, 'SenderNumber:', senderNumber); // Para depuração

    const isAdmin = await isUserAdmin(chat, senderId);

    // Permite se for admin OU número liberado (agora compatível com formato lid)
    if (!isAdmin && senderNumber !== NUMERO_LIBERADO) {
        await message.reply('❌ APENAS ADM ❌ .');
        return;
    }

    const match = message.body.match(/^\/xiu(\d*)/i);
    let minutos = 1;
    if (match && match[1]) {
        minutos = parseInt(match[1]);
        if (isNaN(minutos) || minutos < 1) minutos = 1;
    }

    const mentionedIds = message.mentionedIds || (message._data && message._data.mentionedIds) || [];
    if (!mentionedIds || mentionedIds.length === 0) {
        await message.reply('❗ Use: /xiu[MINUTOS] @pessoa (marcando alguém)');
        return;
    }

    const groupId = message.from;
    const userId = mentionedIds[0];
    const muteKey = `${groupId}_${userId}`;

    let msgs = [];
    try {
        msgs = await chat.fetchMessages({ limit: 50 });
    } catch (e) {
        await message.reply('❌ Não consegui buscar mensagens antigas.');
        return;
    }

    const agora = Date.now();
    let count = 0;

    for (const msg of msgs) {
        const authorId = msg.author || msg.from || msg.sender || msg.participant;
        if (
            authorId === userId &&
            (agora - msg.timestamp * 1000 < 5 * 60 * 1000)
        ) {
            try {
                await msg.delete(true);
                count++;
                await new Promise(r => setTimeout(r, 400));
            } catch (e) {
                // Pode falhar se o bot não for admin ou mensagem for antiga demais
            }
        }
    }

    // Calcula o horário de liberação
    const liberaTimestamp = Date.now() + minutos * 60 * 1000;
    const liberaData = new Date(liberaTimestamp);
    const hora = liberaData.getHours().toString().padStart(2, '0');
    const min = liberaData.getMinutes().toString().padStart(2, '0');
    const seg = liberaData.getSeconds().toString().padStart(2, '0');

    mutedUsers.set(muteKey, liberaTimestamp);

    await message.reply(
        `🔇 Usuário silenciado por ${minutos} minuto(s)!\n` +
        `${count} mensagens apagadas.\n` +
        `⏰ Volte: *${hora}:${min}:${seg}*.`
    );
}

/**
 * Intercepta mensagens de usuários silenciados e apaga automaticamente.
 */
async function onMessage(client, message) {
    if (!message.from.endsWith('@g.us')) return;

    const groupId = message.from;
    const userId = message.author || message.from || message.sender || message.participant;
    if (!userId) return;

    const muteKey = `${groupId}_${userId}`;
    const until = mutedUsers.get(muteKey);

    if (until && Date.now() < until) {
        try {
            await message.delete(true);
        } catch (e) {
            // Pode falhar se o bot não for admin ou mensagem for antiga demais
        }
    } else if (until) {
        mutedUsers.delete(muteKey);
    }
}

module.exports = {
    calabocaCommand,
    onMessage
};
