const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Pasta onde a mídia será salva
const mediaFolder = path.join(__dirname, 'midias');
if (!fs.existsSync(mediaFolder)) {
    fs.mkdirSync(mediaFolder, { recursive: true });
}

const MAX_MIDIAS = 15;
let lastDeletedMedia = null;
let isReplaying = false;
let processedMessages = new Set();
let isInitialized = false;
let initializationTimeout;

// Função para gerenciar o limite de mídias na pasta
function manterUltimasMidias() {
    const files = fs.readdirSync(mediaFolder)
        .map(file => ({
            name: file,
            time: fs.statSync(path.join(mediaFolder, file)).mtime.getTime()
        }))
        .sort((a, b) => a.time - b.time); // Mais antigas primeiro

    while (files.length > MAX_MIDIAS) {
        const oldest = files.shift();
        fs.unlinkSync(path.join(mediaFolder, oldest.name));
        console.log(`🧹 Mídia removida por limite: ${oldest.name}`);
    }
}

const initializeAudioReenviador = (client) => {
    client.setMaxListeners(30);


    client.on('message', async (message) => {
        if (!isInitialized) return;
        if (processedMessages.has(message.id.id)) return;
        processedMessages.add(message.id.id);

        // Limita o tamanho do cache para evitar sobrecarga
        if (processedMessages.size > 1000) {
            const firstId = Array.from(processedMessages)[0];
            processedMessages.delete(firstId);
        }

        const command = message.body.trim().toLowerCase();

        if (message.hasMedia) {
            try {
                // Verifica se a mensagem é recente (últimos 5 minutos)
                const messageAge = Date.now() - message.timestamp * 1000;
                if (messageAge > 300000) {
                    console.log('⏳ Ignorando mídia antiga');
                    return;
                }

                const media = await message.downloadMedia();
                if (media) {
                    const extension = media.mimetype.split('/')[1].split(';')[0];
                    const fileName = `${message.id.id}.${extension}`;
                    const filePath = path.join(mediaFolder, fileName);

                    fs.writeFile(filePath, media.data, 'base64', (err) => {
                        if (err) {
                            console.error('❌ Erro ao salvar mídia:', err);
                        } else {
                            lastDeletedMedia = {
                                id: message.id.id,
                                path: filePath,
                                type: message.type,
                                sender: message._data.notifyName || 'Desconhecido',
                                time: new Date().toLocaleTimeString()
                            };
                            console.log(`✅ Mídia salva: ${path.basename(filePath)}`);
                            manterUltimasMidias(); // Sempre mantém só as 5 últimas!
                        }
                    });
                }
            } catch (error) {
                console.error('❌ Erro no download de mídia:', error.message);
            }
        }

        if (command === '/x9') {
            if (isReplaying) {
                console.log('ℹ️ Reenvio já em andamento');
                return;
            }

            isReplaying = true;

            try {
                if (!lastDeletedMedia) {
                    console.log('ℹ️ Nenhuma mídia disponível para reenvio');
                    await client.sendMessage(message.from, 'Nenhuma mídia apagada recentemente 🚫');
                    return;
                }

                if (!fs.existsSync(lastDeletedMedia.path)) {
                    console.log('ℹ️ Arquivo de mídia não encontrado');
                    await client.sendMessage(message.from, 'Mídia expirada ou não encontrada ⏳');
                    return;
                }

                const mediaBuffer = fs.readFileSync(lastDeletedMedia.path);
                let mediaMessage;

                if (lastDeletedMedia.type.includes('image') || lastDeletedMedia.type.includes('video')) {
                    mediaMessage = new MessageMedia('image/jpeg', mediaBuffer.toString('base64'), 'imagem.jpg');
                } else if (lastDeletedMedia.type.includes('audio') || lastDeletedMedia.type.includes('ptt')) {
                    mediaMessage = new MessageMedia('audio/mpeg', mediaBuffer.toString('base64'), 'audio.mp3');
                } else {
                    mediaMessage = new MessageMedia('application/octet-stream', mediaBuffer.toString('base64'), 'arquivo.bin');
                }

                const caption = `👤 *${lastDeletedMedia.sender}* apagou esta mídia às *${lastDeletedMedia.time}*!`;
                await client.sendMessage(message.from, mediaMessage, { caption });
                console.log(`📤 Mídia reenviada de ${lastDeletedMedia.sender}`);

            } catch (error) {
                console.error('❌ Erro no reenvio:', error.message);
                await client.sendMessage(message.from, 'Erro ao recuperar mídia ⚠️');
            } finally {
                isReplaying = false;
            }
        }
    });
};

// Resetar estado ao reiniciar
process.on('SIGINT', () => {
    if (initializationTimeout) clearTimeout(initializationTimeout);
    console.log('♻️ Estado do módulo resetado');
    process.exit();
});

module.exports = { initializeAudioReenviador };
