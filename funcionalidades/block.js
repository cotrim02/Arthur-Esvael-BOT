const fs = require('fs');
const path = require('path');

const blockedPath = path.join(__dirname, 'blocked.json');

// Lê os números bloqueados do arquivo JSON
function getBlockedNumbers() {
    if (!fs.existsSync(blockedPath)) return [];
    return JSON.parse(fs.readFileSync(blockedPath));
}

// Salva os números bloqueados no arquivo JSON
function saveBlockedNumbers(numbers) {
    fs.writeFileSync(blockedPath, JSON.stringify(numbers, null, 2));
}

module.exports = async (client, message) => {
    const body = message.body.toLowerCase().trim();

    // Comando para bloquear um número
    if (body.startsWith('/block')) {
        const partes = message.body.trim().split(' ');
        if (partes.length < 2) {
            return message.reply('Use o comando assim: /block 5511912345678');
        }

        const numero = partes[1].replace(/\D/g, '');

        if (!numero || numero.length < 10) {
            return message.reply('Número inválido.');
        }

        const bloqueados = getBlockedNumbers();

        if (bloqueados.includes(numero)) {
            return message.reply('Número já está bloqueado.');
        }

        bloqueados.push(numero);
        saveBlockedNumbers(bloqueados);
        return message.reply('Número bloqueado com sucesso.');
    }

    // Comando para listar todos os números bloqueados
    if (body === '!blockedlist') {
        const bloqueados = getBlockedNumbers();

        if (bloqueados.length === 0) {
            return message.reply('Nenhum número está bloqueado.');
        }

        const listaFormatada = bloqueados.map(num => `• ${num}`).join('\n');
        return message.reply(`📛 Lista de números bloqueados:\n\n${listaFormatada}`);
    }
};
 