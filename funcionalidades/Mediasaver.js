const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const MAX_HISTORY = 15; // máximo de arquivos no histórico e pasta midias

let processedMessages = new Set();

const deletedDataFile = 'deletedMediaHistory.json';

let deletedItemsHistory = [];

let deletedHistoryPath = '';
let mediaFolder = '';

function getFileName(index, extension) {
    return `${index + 1}.${extension}`;
}

function formatTime(timestamp) {
    const d = new Date(timestamp * 1000);
    const pad = n => n.toString().padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function sendMediaAsSticker(client, chatId, filePath) {
    const buffer = fs.readFileSync(filePath);
    const webpBuffer = await sharp(buffer)
        .resize(512, 512, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
        .webp({ quality: 80 })
        .toBuffer();

    const media = new MessageMedia('image/webp', webpBuffer.toString('base64'), 'sticker.webp');
    await client.sendMessage(chatId, media, { sendMediaAsSticker: true });
}

async function handleReenvioMensagemApagada(client, message, item) {
    if (!item || !item.fileName) {
        await client.sendMessage(message.from, 'Arquivo não encontrado no histórico.');
        return;
    }

    const filePath = path.join(mediaFolder, item.fileName);
    if (!fs.existsSync(filePath)) {
        await client.sendMessage(message.from, 'Arquivo físico não encontrado.');
        return;
    }

    if (item.type === 'texto') {
        const texto = fs.readFileSync(filePath, 'utf8');
        await client.sendMessage(message.from, `Mensagem de ${item.sender}: ${texto}`);
    } else if (item.type === 'sticker') {
        const buffer = fs.readFileSync(filePath);
        const media = new MessageMedia('image/webp', buffer.toString('base64'), item.fileName);
        await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
    } else if (item.type === 'image') {
        await sendMediaAsSticker(client, message.from, filePath);
    } else {
        const buffer = fs.readFileSync(filePath);
        const media = new MessageMedia(item.mimetype || 'application/octet-stream', buffer.toString('base64'), item.fileName);
        await client.sendMessage(message.from, media, { caption: item.title });
    }
}

function saveDeletedItemsHistory(fullPath) {
    try {
        fs.writeFileSync(fullPath, JSON.stringify(deletedItemsHistory, null, 2));
    } catch(err) {
        console.error('Erro ao salvar histórico:', err);
    }
}

function loadDeletedItemsHistory(fullPath) {
    if (fs.existsSync(fullPath)) {
        try {
            const data = fs.readFileSync(fullPath, 'utf8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        } catch(err) {
            console.error('Erro ao carregar histórico:', err);
        }
    }
    return [];
}

const initializeMediaSaverWithDeletedLog = (client, mediaFolderPath) => {
    mediaFolder = mediaFolderPath;
    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder, { recursive: true });

    deletedHistoryPath = path.join(mediaFolder, deletedDataFile);
    deletedItemsHistory = loadDeletedItemsHistory(deletedHistoryPath);

    client.setMaxListeners(30);

    let nextSaveIndex = 0;

    client.on('message', async message => {
        if (processedMessages.has(message.id.id)) return;
        processedMessages.add(message.id.id);

        if (processedMessages.size > 1000) {
            processedMessages.delete(processedMessages.values().next().value);
        }

        // Comando /x9 para listagem e envio
        if (message.body && message.body.toLowerCase().startsWith('/x9')) {
            const args = message.body.trim().split(' ');

            if (args.length === 1) {
                if (deletedItemsHistory.length === 0) {
                    await client.sendMessage(message.from, 'Nenhum arquivo salvo no histórico.');
                    return;
                }

                const maxToShow = Math.min(MAX_HISTORY, deletedItemsHistory.length);
                const toList = deletedItemsHistory.slice(0, maxToShow);

                const readMore = '​'.repeat(1500); // caractere invisível para read more

                // Formata títulos para a lista com abreviação
                function formatTitle(item) {
                    if (!item || !item.title) return '';
                    const sender = item.sender || 'Desconhecido';
                    switch (item.type) {
                        case 'texto': return `MSG DE ${sender}`;
                        case 'image': return `IMG DE ${sender}`;
                        case 'sticker': return `STK DE ${sender}`;
                        case 'video': return `VID DE ${sender}`;
                        case 'audio':
                        case 'ptt': return `AUD DE ${sender}`;
                        default: return `${item.type.toUpperCase()} DE ${sender}`;
                    }
                }

                const listText = toList
                    .map((item, i) => `${i + 1} - ${formatTitle(item)}`)
                    .join('\n');

                const mensagemFinal = `👀${readMore}\n\n${listText}`;

                await client.sendMessage(message.from, mensagemFinal);
                return;
            }

            if (args.length === 2) {
                const n = parseInt(args[1], 10) - 1;

                if (isNaN(n) || n < 0 || n >= Math.min(MAX_HISTORY, deletedItemsHistory.length)) {
                    await client.sendMessage(message.from, 'Número inválido. Use um número da lista /x9.');
                    return;
                }

                const item = deletedItemsHistory[n];
                await handleReenvioMensagemApagada(client, message, item);
                return;
            }
        }

        // Salva mídia AO RECEBER a mensagem (UMA ÚNICA VEZ), criando arquivo e atualizando JSON
        if (message.hasMedia) {
            try {
                const media = await message.downloadMedia();
                if (media) {
                    const mimetype = media.mimetype.split(';')[0];
                    const typeMain = mimetype.split('/')[0];
                    const subtype = mimetype.split('/')[1];
                    const tiposAceitos = ['image', 'audio', 'video'];
                    const extMap = {
                        webp: 'webp', jpeg: 'jpg', jpg: 'jpg', png: 'png', gif: 'gif',
                        mp4: 'mp4', mpeg: 'mp3', ogg: 'ogg', opus: 'opus',
                    };
                    if (tiposAceitos.includes(typeMain) || (typeMain === 'image' && subtype === 'webp')) {
                        const extension = extMap[subtype] || subtype;
                        const sender = message._data.notifyName || 'Desconhecido';
                        const fileName = getFileName(nextSaveIndex, extension);
                        const filePath = path.join(mediaFolder, fileName);
                        fs.writeFileSync(filePath, media.data, 'base64');

                        const timeStr = formatTime(message.timestamp);
                        const titleBase = `${typeMain.charAt(0).toUpperCase() + typeMain.slice(1)} de ${sender}`;
                        const title = `${titleBase} às ${timeStr}`;

                        // Remove itens prévios com mesmo fileName para evitar duplicação
                        deletedItemsHistory = deletedItemsHistory.filter(item => item.fileName !== fileName);

                        deletedItemsHistory.unshift({
                            type: typeMain,
                            mimetype,
                            extension,
                            fileName,
                            title,
                            sender,
                            timestamp: message.timestamp,
                            text: null,
                        });

                        if (deletedItemsHistory.length > MAX_HISTORY) deletedItemsHistory.pop();

                        saveDeletedItemsHistory(deletedHistoryPath);

                        nextSaveIndex = (nextSaveIndex + 1) % MAX_HISTORY;
                    }
                }
            } catch(err) {
                console.error('Erro salvando mídia:', err);
            }
        }
    });

    // Só salva texto no evento mensagem apagada, NÃO altera mídia já salva no JSON
    client.on('message_revoke_everyone', async (after, before) => {
        if (!before) return;

        if (!before.hasMedia) {
            const senderRaw = before._data.notifyName || 'Desconhecido';
            const timeStr = formatTime(before.timestamp);
            const text = before.body || '';
            const fileName = getFileName(nextSaveIndex, 'txt');
            const filePath = path.join(mediaFolder, fileName);

            try {
                fs.writeFileSync(filePath, text, 'utf8');
            } catch (error) {
                console.error('Erro ao salvar texto:', error);
            }

            const title = `MSG DE ${senderRaw} às ${timeStr}`;

            // Remove do histórico arquivos txt duplicados
            deletedItemsHistory = deletedItemsHistory.filter(item => item.fileName !== fileName);

            deletedItemsHistory.unshift({
                type: 'texto',
                text,
                fileName,
                title,
                sender: senderRaw,
                timestamp: before.timestamp,
            });

            if (deletedItemsHistory.length > MAX_HISTORY) deletedItemsHistory.pop();

            saveDeletedItemsHistory(deletedHistoryPath);

            nextSaveIndex = (nextSaveIndex + 1) % MAX_HISTORY;

            console.log(`🗑️ Texto apagado registrado: ${title} (posição 1)`);
        }
        // Para mídia apagada: não altera histórico JSON para evitar duplicidade
    });
};

module.exports = { initializeMediaSaverWithDeletedLog };
