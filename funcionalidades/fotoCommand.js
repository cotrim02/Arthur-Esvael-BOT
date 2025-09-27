const { MessageMedia } = require('whatsapp-web.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

module.exports = async (client, message) => {
    const commandRegex = /^\/foto\s+@(\d+)/;
    const match = message.body.match(commandRegex);
    if (!match || !message.mentionedIds.length) return;

    const userId = message.mentionedIds[0]; // Usar o primeiro ID mencionado

    try {
        const url = await client.getProfilePicUrl(userId);
        if (!url) {
            await message.reply('Usuário não possui foto de perfil.');
            return;
        }

        const res = await fetch(url);
        const buffer = await res.buffer();
        const mimetype = res.headers.get('content-type');

        // Salvar arquivo na pasta /midias
        const extension = mimetype.split('/')[1] || 'jpg'; // extrai extensão do mimetype
        const dir = path.join(__dirname, 'midias');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        const filePath = path.join(dir, `${userId.replace('@c.us','')}.${extension}`);
        fs.writeFileSync(filePath, buffer);

        // Criar media para enviar
        const media = new MessageMedia(mimetype, buffer.toString('base64'));

        await message.reply(media, undefined, { sendMediaAsSticker: false });
    } catch (err) {
        await message.reply('Não foi possível obter a foto de perfil.');
        console.error(err);
    }
};
