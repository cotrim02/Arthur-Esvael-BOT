const fs = require('fs');
const path = require('path');

const dataFolderPath = path.join(__dirname, 'data');
const filePath = path.join(dataFolderPath, 'jv_count.json');

// Garante que a pasta 'data' existe
if (!fs.existsSync(dataFolderPath)) {
  fs.mkdirSync(dataFolderPath);
}

// Garante que o arquivo JSON existe
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, JSON.stringify({ count: 0 }, null, 2));
}

async function contadorJV(client, message) {
  if (message.body.toLowerCase() === '/jv') {
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);

    data.count++;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    // Centralizando o texto usando espaços e emojis
    const resposta = `
🚨🚨🚨

*João Victor* fumou \n **${data.count}* pigas! 🚬😮‍💨

🚨🚨🚨
    `;

    await message.reply(resposta.trim());
  }
}

module.exports = { contadorJV };
