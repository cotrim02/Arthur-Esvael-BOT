const fs = require('fs');
const path = require('path');

const dataFolderPath = path.join(__dirname, 'data');
const filePath = path.join(dataFolderPath, 'gab_count.json');

// Garante que a pasta 'data' existe
if (!fs.existsSync(dataFolderPath)) {
  fs.mkdirSync(dataFolderPath);
}

// Garante que o arquivo JSON existe
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({ count: 0 }, null, 2));
}

async function contadorGAB(client, message) {
  if (message.body.toLowerCase() === '/gab') {
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);

    data.count++;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    // Centralizando o texto usando espaços e emojis
    const resposta = `
❣️, 💕, 💞, 💓, 💘, 💖, 💗, 💝, 💟

Gabriel Marianelli recebeu o amor \n                   ESVAELISTA \n                   *${data.count}* vezes! ❤️❤️

💟,🖤, 💙, 🤍, 💛, 🧡, 💚, 💜,❣️
    `;

    await message.reply(resposta.trim());
  }
}

module.exports = { contadorGAB };
