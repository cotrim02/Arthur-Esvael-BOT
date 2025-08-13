const { Client } = require('whatsapp-web.js');
const fs = require('fs');

const emojis = [
    '💀', '👑', '🛡️', '🔥', '🌟', '💍', '⚔️', '🍂', '🦇', '🎭',
    '🦅', '🌿', '🍃', '🎯', '💭', '⏳', '⚡', '💨', '🌌', '🍷',
    '🧝‍♂️', '🧙‍♂️', '🌲', '💔', '🌙', '✨', '🦋', '💧', '🏰', '🌑',
    '⚡️', '🌈', '🦷', '🛶', '🏹', '🧘‍♂️', '👽', '⚓', '🎇', '🕊️',
    '🦸‍♂️', '🦸‍♀️', '🦷', '🧝‍♀️', '🦇', '🌞', '💼', '🔮', '👁️', '🌕',
    '🗡️', '⚔️', '👑', '🏰', '🌟', '🛡️', '📜', '🕯️', '🦸‍♂️', '🐉',
    '🧙‍♂️', '🌲', '🦅', '🔥', '❄️', '💀', '👻', '🧝‍♂️', '💍', '💔',
    '🌙', '✨', '🦋', '💧', '🍂', '🎭', '🏹', '🎯', '💭', '⏳', '⚡',
    '🌑', '🌈', '🦷', '🛶', '🏹', '🧘‍♂️', '👽', '⚓', '🎇', '💨',
    '🌌', '🍷', '🖤', '🧝‍♀️', '🦇', '🌞', '💼', '🔮', '👁️', '🕊️',
    '🌕', '💀', '⚡', '🔥', '🌪️', '💨', '⚔️', '⚡️', '🎯', '💭',
    '🍃', '🧙‍♂️', '🦸‍♂️', '🦸‍♀️', '🍂', '🌲', '🦅', '🌪', '💨',
    '🏰', '✨', '🔮', '⚔️', '🏹', '🌙', '💔', '👑', '⚡', '🎯',
    '⚔️', '🔥', '🌑', '🌕', '💀', '🌪️', '💍', '🔥', '⚡', '🎇',    
    '🍆', '🍑', '👅', '💦', '😈', '👙', '🔥', '🔞', '💋', '👠', 
    '🍸', '🍷', '🛏️', '🧨', '🧿', '🫦', '💣', '👄', '🧴', '🥵', 
    '🥴', '😏', '😳', '😜', '🤤', '🤭', '🫣', 
    '💥', '🥂', '🎀', '👓', '👡', '🍒', '🍻', '🍺', '🍹', '🥃', 
];

// Emojis específicos para reações de "morte"
const emojisMorte = [
    '💀', '❔','❓','⚰️', '🔫', '☠️','❔','❓', '🖕', '🤬', 
    '🔪', '🎯', '🚨','❔','❓','👮‍♀️', '🚫', '💣', '❔','❓','☢️', 
    '🕵️‍♂️', '🚔','🏳️','❔','❓','❌'
];

// Lista de números que devem receber emojis de morte
const numerosMorte = [
    '555197927391@c.us',
    '551100000000@c.us'
];

let messageCount = 0;
const ultimoEmojiPorNumero = {};
const ultimaReacaoTimestamp = {}; // Controla tempo entre reações

async function reagirAMensagem(message) {
    try {
        // Ignora mensagens de grupos e do próprio bot
        if (message.fromMe || message.isGroupMsg) return;

        messageCount++;
        const remetente = message.author || message.from;
        const agora = Date.now();

        // Verifica intervalo mínimo entre reações (2 segundos)
        if (ultimaReacaoTimestamp[remetente] && agora - ultimaReacaoTimestamp[remetente] < 2000) {
            return;
        }

        // Reação para números especiais
        if (numerosMorte.includes(remetente)) {
            let emojiAleatorio;
            let tentativas = 0;
            
            do {
                emojiAleatorio = emojisMorte[Math.floor(Math.random() * emojisMorte.length)];
                tentativas++;
            } while (
                emojiAleatorio === ultimoEmojiPorNumero[remetente] && 
                tentativas < 10
            );

            ultimoEmojiPorNumero[remetente] = emojiAleatorio;
            await message.react(emojiAleatorio);
            console.log(`[MORTE] Reagiu com ${emojiAleatorio} para ${remetente}`);
            ultimaReacaoTimestamp[remetente] = agora;
            return;
        }

        // Reação padrão a cada 10 mensagens
        if (messageCount >= 10) {
            messageCount = 0;
            const emojiAleatorio = emojis[Math.floor(Math.random() * emojis.length)];
            await message.react(emojiAleatorio);
            console.log(`[PADRÃO] Reagiu com ${emojiAleatorio} para ${remetente}`);
            ultimaReacaoTimestamp[remetente] = agora;
        }
    } catch (error) {
        console.error('Erro na reação:', error.message);
        
        // Fallback: responde com emoji se reação falhar
        if (message && !message.fromMe) {
            const fallbackEmoji = '⚠️';
            await message.reply(fallbackEmoji);
            console.log(`Fallback: respondeu com ${fallbackEmoji} para ${message.from}`);
        }
    }
}

module.exports = {
    reagirAMensagem
};