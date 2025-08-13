const frasesArthurEsvael = require('./frases_arthur');

const gruposPermitidos = [
    '120363380398336548@g.us',
    '120363417873563907@g.us'
];

let contadorMensagens = 0;

// Lista embaralhada de frases (para controle)
let frasesRestantes = embaralharArray([...frasesArthurEsvael]);

function contarMensagens(message, client) {
    if (!message.from || !gruposPermitidos.includes(message.from)) return;

    contadorMensagens++;

    if (contadorMensagens >= 15) {
        if (frasesRestantes.length === 0) {
            // Se acabaram as frases, reembaralha 
            frasesRestantes = embaralharArray([...frasesArthurEsvael]);
        }

        const frase = frasesRestantes.pop(); // Remove uma da lista
        client.sendMessage(message.from, frase, {
            quotedMessageId: message.id._serialized
        });

        contadorMensagens = 0;
    }
}

// Função para embaralhar array (algoritmo de Fisher-Yates)
function embaralharArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

module.exports = {
    contarMensagens,
};
