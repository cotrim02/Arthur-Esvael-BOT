// sticker.js
const { MessageMedia } = require('whatsapp-web.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sendSticker = async (client, message, stickerPath) => {
    try {
        const fullPath = path.resolve(__dirname, stickerPath);

        if (!fs.existsSync(fullPath)) {
            throw new Error('Arquivo de sticker não encontrado: ' + fullPath);
        }

        const processedSticker = await sharp(fullPath)
            .resize(512, 512)
            .webp()
            .toBuffer();

        const base64 = processedSticker.toString('base64');
        const stickerMedia = new MessageMedia('image/webp', base64, 'sticker.webp');

        await client.sendMessage(message.from, stickerMedia, { sendMediaAsSticker: true });
        console.log('Sticker enviado!');
    } catch (error) {
        console.error('Erro ao enviar sticker:', error);
    }
};

module.exports = { sendSticker };
