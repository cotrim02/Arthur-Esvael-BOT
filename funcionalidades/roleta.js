const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

const SCORES_FILE = path.join(__dirname, '../Contadores/data/roleta_scores.json');
const gruposPermitidos = [
    '120363380398336548@g.us',
    '120363417873563907@g.us'
];

// Texto das regras
const textoRegrasRoleta = `
🎲 *ROLETA RUSSA - Regras do Jogo*

- Para jogar, envie o comando /roleta.
- O bot simula o clássico jogo de roleta russa: você gira o tambor e puxa o gatilho.
- Dois resultados possíveis:
   • *Sobreviveu*: A arma falha, você escapa ileso e ganha uma vitória.
   • *Morreu*: A arma dispara, você é eliminado do grupo e ganha uma derrota.
- O tempo fora do grupo aumenta conforme o número de vezes que você já morreu:
   • 1 morte: volta rápido
   • 2 a 4 mortes: 5 segundos fora
   • 5 a 9 mortes: 30 segundos fora
   • 10 a 14 mortes: 2 minutos fora
   • 15 ou mais mortes: 5 minutos fora
- Após o tempo, o bot tenta te readicionar. Se não conseguir, envia um link de convite no privado.
- Use /ranking para ver quem mais sobreviveu e quem mais morreu na Roleta Russa.

Aqui, cada um só arrisca a própria sorte!
Boa diversão e cuidado: a sorte pode virar a qualquer momento! 💀🔫
`;

// Funções de pontuação
function carregarPontuacoes() {
    try {
        const dataDir = path.dirname(SCORES_FILE);
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        if (fs.existsSync(SCORES_FILE)) return JSON.parse(fs.readFileSync(SCORES_FILE));
    } catch (e) { console.error('Erro ao carregar pontuações:', e); }
    return {};
}
function salvarPontuacoes(pontuacoes) {
    try { fs.writeFileSync(SCORES_FILE, JSON.stringify(pontuacoes, null, 2)); }
    catch (e) { console.error('Erro ao salvar pontuações:', e); }
}
function atualizarPontuacao(userId, resultado) {
    const pontuacoes = carregarPontuacoes();
    if (!pontuacoes[userId]) pontuacoes[userId] = { vitorias: 0, derrotas: 0 };
    if (resultado === 3 || resultado === 7) pontuacoes[userId].derrotas++;
    else pontuacoes[userId].vitorias++;
    salvarPontuacoes(pontuacoes);
    return pontuacoes[userId];
}
function calcularTempoBanimento(derrotas) {
    if (derrotas <= 1) return 0;
    if (derrotas <= 4) return 5000;
    if (derrotas <= 9) return 30000;
    if (derrotas <= 14) return 120000;
    return 300000;
}
async function exibirRanking(client, groupId) {
    const pontuacoes = carregarPontuacoes();
    const entries = await Promise.all(Object.entries(pontuacoes).map(async ([userId, dados]) => {
        try {
            const contato = await client.getContactById(userId);
            return { userId, nome: contato.pushname || contato.name || contato.number || userId.split('@')[0], ...dados };
        } catch {
            return { userId, nome: userId.split('@')[0], ...dados };
        }
    }));
    const topVencedores = entries.sort((a, b) => b.vitorias - a.vitorias).slice(0, 5);
    const topPerdedor = entries.sort((a, b) => b.derrotas - a.derrotas)[0];

    let resposta = "🏆 *TOP 5 SOBREVIVENTES DA ROLETA RUSSA* 🏆\n\n";
    topVencedores.forEach((j, i) => {
        resposta +=
            `*${i + 1}.* ${j.nome}\n` +
            `   Vitórias: ${j.vitorias}\n` +
            `   Derrotas: ${j.derrotas}\n` +
            `─────────────\n`;
    });
    resposta += "─────────────\n";
    resposta += "💀 *MAIOR PERDEDOR* 💀\n";
    resposta += `${topPerdedor.nome}\n   Derrotas: ${topPerdedor.derrotas}\n   Vitórias: ${topPerdedor.vitorias}\n`;
    resposta += "─────────────";

    const mentions = [...topVencedores.map(j => j.userId), topPerdedor.userId];
    await client.sendMessage(groupId, resposta, { mentions });
}

module.exports = (client) => {
    let faseDeTesteAtivada = false;
    
    // Frases temáticas
    const frasesSobreviveu = [
        (nome) => `${nome} puxou o gatilho... mas a arma falhou. Você sobreviveu! 🔫❌`,
        (nome) => `${nome} atirou na própria cabeça, mas só ouviu o clique seco do gatilho. Ainda está vivo! 🔫👂`,
        (nome) => `${nome} encarou o tambor, puxou o gatilho e... nada aconteceu. A sorte está do seu lado! 🔫🎲`,
        (nome) => `${nome} tentou a sorte, mas a bala não disparou. Sobreviveu à ROLETA RUSSA! 🔫🛡️`,
        (nome) => `${nome} girou o tambor, puxou o gatilho e escapou ileso dessa rodada! 🔫🌀`,
        (nome) => `${nome} sentiu o frio do metal, mas a arma não disparou. Sobreviveu! 🔫❄️`
    ];
    const frasesMorreu = [
        (nome, emoji) => `${nome} puxou o gatilho... e a arma disparou! ${emoji} Você foi eliminado na ROLETA RUSSA! 🔫💥`,
        (nome, emoji) => `${nome} encarou a sorte, mas dessa vez a bala estava lá. ${emoji} Fim de jogo! 🔫🎯`,
        (nome, emoji) => `${nome} girou o tambor e ouviu o estrondo fatal. ${emoji} ROLETA RUSSA não perdoa! 🔫💣`,
        (nome, emoji) => `${nome} apostou a vida e perdeu: a arma disparou. ${emoji} Até a próxima! 🔫🎰`,
        (nome, emoji) => `${nome} tentou desafiar o destino, mas a bala encontrou seu caminho. ${emoji} Você caiu na ROLETA RUSSA! 🔫☠️`
    ];
    const emojisMorte = ['💀', '☠️', '⚰️', '🔫', '🩸', '🧟', '🧛', '🦴'];

    client.on('message', async (message) => {
        try {
            if (!gruposPermitidos.includes(message.from)) return;

            // Comando de regras
            if (message.body.toLowerCase() === '/regra' || message.body.toLowerCase() === '!regra') {
                await client.sendMessage(message.from, textoRegrasRoleta);
                return;
            }

            // Ranking
            if (message.body.toLowerCase() === '/ranking') {
                await exibirRanking(client, message.from);
                return;
            }
            // Toggle teste
            if (message.body.toLowerCase() === '/teste-roleta') {
                faseDeTesteAtivada = !faseDeTesteAtivada;
                await message.reply(`Fase de teste ${faseDeTesteAtivada ? 'ativada' : 'desativada'}.`);
                return;
            }
            // Roleta Russa
            if (message.body.toLowerCase() === '/roleta') {
                const groupId = message.from;
                const group = await client.getChatById(groupId);
                if (!group.isGroup) return;

                // O jogador é quem enviou a mensagem
                const idJogador = message.author || message.from;
                const contato = await client.getContactById(idJogador);
                const nomeJogador = contato.pushname || contato.name || contato.number || idJogador.split('@')[0];

                // Verifica se o jogador está no grupo
                const jogadorEstaNoGrupo = group.participants.some(p =>
                    p.id._serialized === idJogador
                );
                if (!jogadorEstaNoGrupo) {
                    await message.reply("❌ Você precisa estar no grupo para jogar!");
                    return;
                }

                // Sorteio do resultado
                const result = faseDeTesteAtivada ? 7 : Math.floor(Math.random() * 7) + 1;
                atualizarPontuacao(idJogador, result);
                const pontuacao = carregarPontuacoes()[idJogador] || { vitorias: 0, derrotas: 0 };

                let resposta;
                if (result === 3 || result === 7) {
                    // Escolhe aleatoriamente uma frase de morte e um emoji
                    const emoji = emojisMorte[Math.floor(Math.random() * emojisMorte.length)];
                    const frase = frasesMorreu[Math.floor(Math.random() * frasesMorreu.length)];
                    resposta = 
                        `⚰️*ROLETA☠️RUSSA*⚰️\n\n` +
                        `${frase(nomeJogador, emoji)}\n\n` +
                        `─────────────\n` +
                        `Derrotas: ${pontuacao.derrotas}\n─────────────`;

                    // Tenta remover o próprio jogador
                    const botAdmin = group.participants.some(p =>
                        p.id._serialized === client.info.wid._serialized && p.isAdmin
                    );
                    if (botAdmin) {
                        try {
                            await group.removeParticipants([idJogador]);
                            const tempoBanimento = calcularTempoBanimento(pontuacao.derrotas);
                            let tempoLegivel = "5 segundos";
                            if (tempoBanimento === 30000) tempoLegivel = "30 segundos";
                            else if (tempoBanimento === 120000) tempoLegivel = "2 minutos";
                            else if (tempoBanimento === 300000) tempoLegivel = "5 minutos";

                            await message.reply(`⏳ Você foi banido por ${tempoLegivel} (${pontuacao.derrotas} mortes)`);
                            setTimeout(async () => {
                                try {
                                    await group.addParticipants([idJogador]);
                                    await message.reply(`✅ ${nomeJogador} readicionado após banimento!`);
                                } catch (e) {
                                    // Se não conseguir readicionar, tenta mandar invite
                                    try {
                                        const inviteCode = await group.getInviteCode();
                                        await client.sendMessage(
                                            idJogador,
                                            `❌ Não consegui te readicionar ao grupo!\n🔗 Use este link para voltar: https://chat.whatsapp.com/${inviteCode}`
                                        );
                                        await client.sendMessage(
                                            groupId,
                                            `❌ Não consegui readicionar ${nomeJogador}! Link de convite enviado no privado.`
                                        );
                                    } catch {
                                        await client.sendMessage(
                                            groupId,
                                            `❌ Não consegui readicionar ${nomeJogador} nem gerar link de convite.`
                                        );
                                    }
                                }
                            }, tempoBanimento);
                        } catch (e) {
                            console.error('Erro ao remover:', e);
                            resposta += `\n\n⚠️ Não consegui remover você.`;
                        }
                    } else {
                        resposta += `\n\n⚠️ Preciso ser admin para remover.`;
                    }
                } else {
                    // Escolhe aleatoriamente uma frase de sobrevivência
                    const frase = frasesSobreviveu[Math.floor(Math.random() * frasesSobreviveu.length)];
                    resposta = 
                        `⚰️*ROLETA☠️RUSSA*⚰️\n\n` +
                        `${frase(nomeJogador)}\n\n` +
                        `─────────────\n` +
                        `Vitórias: ${pontuacao.vitorias}\n─────────────`;
                }

                await client.sendMessage(groupId, resposta, { mentions: [idJogador] });
            }
        } catch (err) {
            console.error('Erro na roleta:', err);
        }
    });
};
