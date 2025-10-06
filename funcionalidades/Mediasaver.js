const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { MessageMedia } = require('whatsapp-web.js');

const MAX_HISTORY = 15;

let processedMessages = new Set();

const deletedDataFile = 'deletedMediaHistory.json';

let deletedItemsHistory = [];

let deletedHistoryPath = '';
let mediaFolder = '';
let deletedMediaFolder = '';

// Map para relacionar ID da mensagem ao nome do arquivo salvo em mediaFolder
const messageIdToFileName = new Map();

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
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
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

    const filePath = path.join(deletedMediaFolder, item.fileName);
    if (!fs.existsSync(filePath)) {
        await client.sendMessage(message.from, 'Arquivo físico não encontrado na pasta de apagados.');
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
    } catch (err) {
        console.error('Erro ao salvar histórico:', err);
    }
}

function loadDeletedItemsHistory(fullPath) {
    if (fs.existsSync(fullPath)) {
        try {
            const data = fs.readFileSync(fullPath, 'utf8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        }
    }
    return [];
}

const initializeMediaSaverWithDeletedLog = (client, mediaFolderPath) => {
    mediaFolder = mediaFolderPath;
    deletedMediaFolder = path.join(mediaFolder, 'apagados');

    if (!fs.existsSync(mediaFolder)) fs.mkdirSync(mediaFolder, { recursive: true });
    if (!fs.existsSync(deletedMediaFolder)) fs.mkdirSync(deletedMediaFolder, { recursive: true });

    deletedHistoryPath = path.join(mediaFolder, deletedDataFile);
    deletedItemsHistory = loadDeletedItemsHistory(deletedHistoryPath);

    client.setMaxListeners(30);

    let nextSaveIndexMedia = 0;
    let nextSaveIndexDeleted = 0;

    client.on('message', async message => {
        if (processedMessages.has(message.id.id)) return;
        processedMessages.add(message.id.id);

        if (processedMessages.size > 1000) {
            processedMessages.delete(processedMessages.values().next().value);
        }

        if (message.body && message.body.toLowerCase().startsWith('/x9')) {
            const args = message.body.trim().split(' ');

            if (args.length === 1) {
                if (deletedItemsHistory.length === 0) {
                    await client.sendMessage(message.from, 'Nenhum arquivo salvo no histórico de apagados.');
                    return;
                }

                const maxToShow = Math.min(MAX_HISTORY, deletedItemsHistory.length);
                const toList = deletedItemsHistory.slice(0, maxToShow);
                const readMore = '​'.repeat(1500);

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

                const listText = toList.map((item,i) => `${i+1} - ${formatTitle(item)}`).join('\n');
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

        if (message.hasMedia) {
            try {
                const media = await message.downloadMedia();
                if (media) {
                    const mimetype = media.mimetype.split(';')[0];
                    const typeMain = mimetype.split('/')[0];
                    const subtype = mimetype.split('/')[1];
                    const extMap = {
                        webp: 'webp', jpeg: 'jpg', jpg: 'jpg', png: 'png', gif: 'gif',
                        mp4: 'mp4', mpeg: 'mp3', ogg: 'ogg', opus: 'opus',
                    };
                    const extension = extMap[subtype] || subtype;
                    const sender = message._data.notifyName || 'Desconhecido';

                    const fileData = Buffer.from(media.data, 'base64');
                    const fileName = getFileName(nextSaveIndexMedia, extension);
                    const filePath = path.join(mediaFolder, fileName);

                    fs.writeFileSync(filePath, fileData);

                    // Guarda a relação mensagem ID => arquivo para cópia futura
                    messageIdToFileName.set(message.id.id, fileName);

                    nextSaveIndexMedia = (nextSaveIndexMedia + 1) % MAX_HISTORY;
                }
            } catch (err) {
                console.error('Erro salvando mídia recebida:', err);
            }
        }
    });

    client.on('message_revoke_everyone', async (after, before) => {
        if (!before) return;

        if (!before.hasMedia) {
            // texto apagado - mantém o comportamento existente
            const senderRaw = before._data.notifyName || 'Desconhecido';
            const timeStr = formatTime(before.timestamp);
            const text = before.body || '';
            const fileName = getFileName(nextSaveIndexDeleted, 'txt');
            const filePath = path.join(deletedMediaFolder, fileName);

            try {
                fs.writeFileSync(filePath, text, 'utf8');
            } catch (error) {
                console.error('Erro ao salvar texto apagado:', error);
            }

            const title = `MSG DE ${senderRaw} às ${timeStr}`;

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

            nextSaveIndexDeleted = (nextSaveIndexDeleted + 1) % MAX_HISTORY;

            console.log(`🗑️ Texto apagado registrado na pasta apagados: ${title} (posição 1)`);

        } else if (before.hasMedia) {
            console.log('Mensagem apagada: mídia detectada, copiando arquivo da pasta principal para apagados...');

            const fileName = messageIdToFileName.get(before.id.id);
            if (!fileName) {
                console.log('Arquivo original para essa mensagem não encontrado na memória, não será copiado.');
                return;
            }

            const originPath = path.join(mediaFolder, fileName);
            if (!fs.existsSync(originPath)) {
                console.log(`Arquivo original não existe no caminho: ${originPath}`);
                return;
            }

            try {
                if (!fs.existsSync(deletedMediaFolder)) {
                    fs.mkdirSync(deletedMediaFolder, { recursive: true });
                    console.log('Pasta apagados criada.');
                }

                const destFileName = getFileName(nextSaveIndexDeleted, path.extname(fileName).substring(1));
                const destPath = path.join(deletedMediaFolder, destFileName);

                fs.copyFileSync(originPath, destPath);
                console.log(`Arquivo copiado de ${originPath} para ${destPath}`);

                const sender = before._data.notifyName || 'Desconhecido';
                const timeStr = formatTime(before.timestamp);
                const typeExt = path.extname(destFileName).substring(1);
                const titleBase = `${typeExt.toUpperCase()} de ${sender}`;
                const title = `${titleBase} às ${timeStr}`;

                deletedItemsHistory = deletedItemsHistory.filter(item => item.fileName !== destFileName);

                deletedItemsHistory.unshift({
                    type: typeExt,
                    mimetype: before.mimetype || '',
                    extension: typeExt,
                    fileName: destFileName,
                    title,
                    sender,
                    timestamp: before.timestamp,
                    text: null,
                });

                if (deletedItemsHistory.length > MAX_HISTORY) deletedItemsHistory.pop();

                saveDeletedItemsHistory(deletedHistoryPath);

                nextSaveIndexDeleted = (nextSaveIndexDeleted + 1) % MAX_HISTORY;

                console.log(`🗑️ Mídia apagada copiada para pasta apagados: ${title} (posição 1)`);

            } catch (err) {
                console.error('Erro ao copiar mídia apagada para pasta apagados:', err);
            }
        }
    });
};

module.exports = { initializeMediaSaverWithDeletedLog };
