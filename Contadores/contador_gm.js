const fs = require('fs');
const path = require('path');
const { MessageMedia } = require('whatsapp-web.js');

const dataFolderPath = path.join(__dirname, 'data');
const filePath = path.join(dataFolderPath, 'gm_count.json');
const stickersFolderPath = path.join(__dirname, 'stickers');
const statePath = path.join(dataFolderPath, 'stickers_state.json');

// Funções utilitárias (iguais ao exemplo anterior)
function getStickerFiles() {
  return fs.readdirSync(stickersFolderPath)
    .filter(file => file.endsWith('.webp'))
    .sort();
}

function getNextStickerIndex(total, lastIndex) {
  return (lastIndex + 1) % total;
}

async function contadorGM(client, message) {
  try {
    if (message.body.toLowerCase() === '/gm') {
      // Atualiza contador
      const fileData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(fileData);
      data.count++;
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      const resposta = `
🚨🚨🚨

*Gabriel Meirelles* foi *racista*, *nazista*, *transfóbico*, *machista*, *Preconceituoso* ou só burro mesmo... 
**${data.count}** vezes! 🚔👮‍♂️

🚨🚨🚨
      `;
      await message.reply(resposta.trim());

      // Lógica dos stickers
      const stickers = getStickerFiles();
      if (stickers.length === 0) {
        await message.reply('❌ Nenhum sticker encontrado!');
        return;
      }
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      const nextIndex = getNextStickerIndex(stickers.length, state.lastIndex);
      const stickerPath = path.join(stickersFolderPath, stickers[nextIndex]);

      fs.writeFileSync(statePath, JSON.stringify({ lastIndex: nextIndex }, null, 2));

      // Cria o sticker com metadados personalizados
      const sticker = MessageMedia.fromFilePath(stickerPath);
      await client.sendMessage(
        message.from,
        sticker,
        {
          sendMediaAsSticker: true,
          stickerMetadata: {
            name: 'RACISTA NOJENTO SMT',
            author: 'GABRIEL MEIRELLES'
          }
        }
      );''
    }
  } catch (err) {
    console.error('Erro no contadorGM:', err);
    await message.reply('Ocorreu um erro ao processar o comando.');
  }
}

module.exports = { contadorGM };
