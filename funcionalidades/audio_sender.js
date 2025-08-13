const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const { acervoRespostas } = require('./acervoRespostas'); // Está na mesma pasta 'funcionalidades'

async function sendAudio(message, client) {
    const command = message.body.trim();

    if (!command.startsWith('/') || isNaN(command.slice(1))) return;

    const audioNumber = command.slice(1);

    // Verifica se é uma saga (áudio com várias partes)
const sagas = {
    '3': 5,
    '22': 2,
    '31': 3,
    '9': 2
};


    if (sagas[audioNumber]) {
        const sagaCount = sagas[audioNumber];

        for (let i = 1; i <= sagaCount; i++) {
            const sagaPath = path.join(__dirname, '..', 'audios', `${audioNumber}_${i}.mp3`);

            if (!fs.existsSync(sagaPath)) {
                await message.reply(`⚠️ Parte ${i} da saga /${audioNumber} não foi encontrada.`);
                continue;
            }

            try {
                const media = MessageMedia.fromFilePath(sagaPath);

                // Envia o título só uma vez, antes da primeira parte
                if (i === 1 && acervoRespostas[audioNumber]) {
                    const resposta = ` ${acervoRespostas[audioNumber]} `;
                    await client.sendMessage(message.from, resposta);
                }

                await client.sendMessage(message.from, media, { sendAudioAsVoice: true });
                console.log(`🎵 Saga ${audioNumber} - Parte ${i} enviada.`);
            } catch (error) {
                console.error(`❌ Erro ao enviar ${audioNumber}_${i}.mp3:`, error);
                await message.reply(`⚠️ Erro ao enviar a parte ${i}.`);
            }
        }

        return;
    }

    // Áudios normais (ex: /1, /2, etc.)
    const audioPath = path.join(__dirname, '..', 'audios', `${audioNumber}.mp3`);

    if (!fs.existsSync(audioPath)) {
        await message.reply("⚠️ O áudio solicitado não foi encontrado.");
        return;
    }

    try {
        const media = MessageMedia.fromFilePath(audioPath);

        // Envia o título se estiver no acervo
        if (acervoRespostas[audioNumber]) {
            const resposta = ` *${acervoRespostas[audioNumber]}* `;
            await client.sendMessage(message.from, resposta);
        }

        await client.sendMessage(message.from, media, { sendAudioAsVoice: true });
        console.log(`🎵 Áudio ${audioNumber}.mp3 enviado.`);
    } catch (error) {
        console.error(`❌ Erro ao enviar ${audioNumber}.mp3:`, error);
        await message.reply("⚠️ Erro ao enviar o áudio.");
    }
}

module.exports = { sendAudio };
