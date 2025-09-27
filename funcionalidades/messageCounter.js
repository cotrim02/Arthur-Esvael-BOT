const fs = require('fs');
const path = require('path');

const gruposPermitidos = [
    '120363380398336548@g.us',
    '120363417873563907@g.us',
    '120363402486208825@g.us'
];

let contadorMensagens = 0;
let frasesArthurEsvael = carregarFrases();
let frasesRestantes = embaralharArray([...frasesArthurEsvael]);

function contarMensagens(message, client) {
    if (!message.from || !gruposPermitidos.includes(message.from)) return;

    // Comando !add
    if (message.body.startsWith('!add ')) {
        const novaFrase = message.body.slice(5).trim();

        if (!novaFrase) {
            client.sendMessage(message.from, '⚠️ Escreva a frase após o comando !add');
            return;
        }

        adicionarFraseJSON(novaFrase, client, message);
        return;
    }

    // Contador normal de mensagens
    contadorMensagens++;

    if (contadorMensagens >= 15) {
        if (frasesRestantes.length === 0) {
            // Recarrega do JSON ao esgotar as frases
            frasesArthurEsvael = carregarFrases();
            frasesRestantes = embaralharArray([...frasesArthurEsvael]);
        }

        const frase = frasesRestantes.pop();
        client.sendMessage(message.from, frase, {
            quotedMessageId: message.id._serialized
        });

        contadorMensagens = 0;
    }
}

// Função para embaralhar array (Fisher-Yates)
function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Função para carregar frases do JSON
function carregarFrases() {
    const filePath = path.join(__dirname, 'frases_arthur.json');
    try {
        const conteudo = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(conteudo);
    } catch (err) {
        console.error('Erro ao ler frases_arthur.json:', err);
        return [];
    }
}

// Função para adicionar nova frase no JSON
function adicionarFraseJSON(frase, client, message) {
    const filePath = path.join(__dirname, 'frases_arthur.json');

    try {
        let frases = carregarFrases();
        frases.push(frase); // adiciona nova frase
        fs.writeFileSync(filePath, JSON.stringify(frases, null, 2), 'utf8');

        // Atualiza listas em memória
        frasesArthurEsvael = frases;
        frasesRestantes = embaralharArray([...frasesArthurEsvael]);

        client.sendMessage(message.from, `✅ Frase adicionada com sucesso:\n"${frase}"`);
    } catch (err) {
        console.error('Erro ao adicionar frase:', err);
        client.sendMessage(message.from, '❌ Erro ao salvar a frase.');
    }
}

module.exports = {
    contarMensagens,
};
