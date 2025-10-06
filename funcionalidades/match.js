const fs = require('fs');
const path = require('path');

// Caminho dos arquivos JSON
const blockedPath = path.join(__dirname, 'blocked.json');
const casadosPath = path.join(__dirname, 'casados.json');

// Função para carregar listas
function getBlockedNumbers() {
    if (!fs.existsSync(blockedPath)) return [];
    return JSON.parse(fs.readFileSync(blockedPath));
}

function getCasadosNumbers() {
    if (!fs.existsSync(casadosPath)) return [];
    return JSON.parse(fs.readFileSync(casadosPath));
}

// Função auxiliar para normalizar IDs (converter @lid em @c.us)
async function normalizeId(client, id) {
    if (!id) return id;
    if (id.includes('@lid')) {
        try {
            const contact = await client.getContactById(id);
            if (contact?.id?._serialized) return contact.id._serialized;
        } catch (e) {
            // falha no getContactById, volta o id original
        }
    }
    return id; // já normalizado ou não @lid
}

module.exports = async (client, message) => {
    if (message.body.toLowerCase().startsWith('/match')) {
        const chat = await message.getChat();

        if (!chat.isGroup) {
            return message.reply('Esse comando só pode ser usado em grupos.');
        }

        // Normaliza quem chamou (autor)
        const quemChamouIdRaw = message.author;
        const quemChamouId = await normalizeId(client, quemChamouIdRaw);
        const quemChamou = quemChamouId.split('@')[0];

        const numerosBloqueados = getBlockedNumbers();
        const numerosCasados = getCasadosNumbers();

        // Seleciona o alvo do match: primeira menção que não seja o próprio usuário
        let alvoMatchId = quemChamouId;  // ID completo para menções
        let alvoMatch = quemChamou;      // só número para lógica

        if (message.mentionedIds && message.mentionedIds.length > 0) {
            // Tenta encontrar a primeira menção diferente do próprio usuário
            let encontrado = false;
            for (const menIdRaw of message.mentionedIds) {
                const menId = await normalizeId(client, menIdRaw);
                if (menId !== quemChamouId) {
                    alvoMatchId = menId;
                    alvoMatch = menId.split('@')[0];
                    encontrado = true;
                    break;
                }
            }
            if (!encontrado) {
                alvoMatchId = quemChamouId;
                alvoMatch = quemChamou;
            }
        }

        // Verifica se algum dos envolvidos está casado
        if (numerosCasados.includes(quemChamou) || numerosCasados.includes(alvoMatch)) {
            return message.reply('💔 Esse match não pode acontecer... alguém aqui já é *casado(ª)*! 💍🚫');
        }

        // MATCH FORÇADO
        const FORCADO_1 = '5511993821219';
        const FORCADO_2 = '5519997021557';

        const isForcado =
            (alvoMatch === FORCADO_1 && quemChamou === FORCADO_2) ||
            (alvoMatch === FORCADO_2 && quemChamou === FORCADO_1) ||
            (alvoMatch === FORCADO_1 && quemChamou !== FORCADO_2) ||
            (alvoMatch === FORCADO_2 && quemChamou !== FORCADO_1) ||
            (quemChamou === FORCADO_1 && alvoMatch === quemChamou) ||
            (quemChamou === FORCADO_2 && alvoMatch === quemChamou);

        if (isForcado) {
            const mention1 = `${FORCADO_1}@c.us`;
            const mention2 = `${FORCADO_2}@c.us`;
            const matchChance = 100;
            const nivel = 'Querem foder e nem disfarçam mais👀👅🔥';
            const safadoEmoji = '💘🔥🥵';

            await chat.sendMessage('🔮 Calculando o match...');

            return setTimeout(() => {
                const reply =
`╔═══ MATCH DETECTADO═══╗
    ${safadoEmoji.repeat(3)}
╚═══════════════════════╝

@${FORCADO_1} + @${FORCADO_2}

Chance de match: *${matchChance}%*
Nível de relacionamento: *${nivel}*

❤️ ${safadoEmoji} ❤️`;

                chat.sendMessage(reply, {
                    mentions: [mention1, mention2]
                });
            }, 1500);
        }

        // Participantes válidos: exclui quem chamou, o alvo, bloqueados
        const participants = chat.participants.filter(p => {
            const userNumber = p.id?.user?.replace(/\D/g, '');
            return (
                userNumber &&
                userNumber !== alvoMatch &&
                userNumber !== quemChamou &&
                !numerosBloqueados.includes(userNumber)
            );
        });

        if (participants.length < 1) {
            return message.reply('Não há pessoas suficientes no grupo para formar um match.');
        }

        // Escolhe aleatoriamente um participante válido
        const index = Math.floor(Math.random() * participants.length);
        const personRandom = participants[index];

        const mention1Id = alvoMatchId;                 // ID completo já normalizado
        const mention2Id = personRandom.id._serialized; // ID completo do aleatório

        const matchChance = Math.floor(Math.random() * 101);

        // let nivel = '';
        // if (matchChance <= 5) nivel = 'Vergonha alheia... nem o Tinder aceitaria 😬';
        // else if (matchChance <= 9) nivel = 'Match NEGATIVO ❌ Nem com 4 garrafas de vodka... 🤢';
        // else if (matchChance <= 15) nivel = 'Só na base da cachaça mesmo 🍺🤢';
        // else if (matchChance <= 24) nivel = 'Climão estranho... mas o tesão fala mais alto 😳🫦';
        // else if (matchChance <= 28) nivel = 'Talvez numa festa estranha com gente esquisita 🤡';
        // else if (matchChance <= 39) nivel = 'Olhares safados rolando... 👀👅';
        // else if (matchChance <= 42) nivel = 'Tá rolando um flerte tímido... ou é ilusão? 👀';
        // else if (matchChance <= 54) nivel = 'Vibe de pegação no rolê 🔥💋';
        // else if (matchChance <= 56) nivel = 'Pega escondido no corredor do rolê 🔥👣';
        // else if (matchChance <= 60) nivel = 'Tem clima, tem vontade, só falta coragem 😶‍🌫️';
        // else if (matchChance <= 69) nivel = 'No escurinho do grupo... tudo pode acontecer 🌑💦';
        // else if (matchChance <= 73) nivel = 'Uns nudes no sigilo já rolaram... 🤫📷';
        // else if (matchChance <= 80) nivel = 'Se sair no rolê, vão se pegar com certeza 😏🍷';
        // else if (matchChance <= 81) nivel = 'Já se pegaram no banheiro do rolê e ninguém sabe... ainda 🚽👀';
        // else if (matchChance <= 83) nivel = 'Se olhar torto já é suficiente pra vir no privado 😏💦';
        // else if (matchChance <= 84) nivel = 'Chamada de vídeo 2 da manhã? Já sabe 😈📞';
        // else if (matchChance <= 85) nivel = 'Tesão acumulado desde 2020 😮‍💨🔥';
        // else if (matchChance <= 87) nivel = 'Um oral bem dado resolveria essa tensão toda 😮🍆💦';
        // else if (matchChance <= 88) nivel = 'Relacionamento sério à vista? 👩‍❤️‍👨💍';
        // else if (matchChance <= 89) nivel = 'Fariam um vídeo que explodiria no Xvideos 🎥🔥';
        // else if (matchChance <= 91) nivel = 'Tanta safadeza que nem o grupo dá conta 😈🍑';
        // else if (matchChance <= 92) nivel = 'Já tem até nome de ship no grupo 💞';
        // else if (matchChance <= 93) nivel = 'Já estão trocando packs enquanto você lê isso 📤🍆📸';
        // else if (matchChance <= 94) nivel = 'Troca de packs e promessas indecentes 🔥📸🍆';
        // else if (matchChance <= 95) nivel = 'Vocês transariam ouvindo gemidão do Zap 🔊🫦';
        // else if (matchChance <= 96) nivel = 'Sexo com playlist e LED vermelho garantido 💋🛏️🔴';
        // else if (matchChance <= 97) nivel = 'Prontos pra morar juntos e ter 3 gatos 🏠🐱';
        // else if (matchChance <= 98) nivel = 'Motel? Já marcaram até suíte temática 🚗🍓🔞';
        // else if (matchChance <= 99) nivel = 'Já estão no “vai dar o c*?” e nem disfarçam mais 🤭🍑';
        // else nivel = 'Sexo selvagem em todas as posições do Kamasutra 🧘‍♀️🔥🐅';
let nivel = '';
if (matchChance <= 5) nivel = 'Desastre total... nem a Phoebe aprovaria esse encontro 🤦‍♂️🔥';
else if (matchChance <= 9) nivel = 'Clima congelado... tá que nem ice bucket challenge 🧊❄️';
else if (matchChance <= 15) nivel = 'Flerte torto, só falta tropeçar na cama 😳🛏️';
else if (matchChance <= 24) nivel = 'Faísca acesa, mas falta o fósforo certo pra pegar fogo 🔥🕯️';
else if (matchChance <= 28) nivel = 'Olhares quentes, mas ainda tímidos... vai ter que avançar 👀💦';
else if (matchChance <= 39) nivel = 'Dançaram juntinhos, até suaram... já é um começo 💃🔥';
else if (matchChance <= 42) nivel = 'Flerte safadinho no grupo, mas só no privado vai rolar mesmo 😏📲';
else if (matchChance <= 54) nivel = 'Pegação garantida, só falta combinar o after-party 😈🍾';
else if (matchChance <= 56) nivel = 'Tão próximos que quase rola um beijo na orelha 👄👂';
else if (matchChance <= 60) nivel = 'Tensão sexual no ar, qualquer toque vira faísca ⚡🔥';
else if (matchChance <= 69) nivel = 'Todo mundo sabe que a festa vai acabar em quarto fechado 🚪💥';
else if (matchChance <= 73) nivel = 'Nudes recebidos e silenciosamente aprovados 🤫📸';
else if (matchChance <= 80) nivel = 'Não negam que rola química até no grupo do zap 🔥💬';
else if (matchChance <= 81) nivel = 'Já protagonizaram cenas picantes no banheiro 🛁🔥';
else if (matchChance <= 83) nivel = 'Olhares que fazem suar até o chão gelado 🥵❄️';
else if (matchChance <= 84) nivel = 'Chamadas madrugada adentro... certeza que não é só papo não 📞😈';
else if (matchChance <= 85) nivel = 'Desejo acumulado que chega a sair fumaça dos ouvidos 😵‍💨🔥';
else if (matchChance <= 87) nivel = 'Nada como um oral bem-feito para incendiar o clima 🍆🔥';
else if (matchChance <= 88) nivel = 'Quase um casal oficial, só falta apresentar pros pais 👩‍❤️‍👨🎉';
else if (matchChance <= 89) nivel = 'Produziriam conteúdo quente que viralizaria fácil no Xvideos 🎥🍿';
else if (matchChance <= 91) nivel = 'Safadeza nível hard: até a polícia do zap vai querer participar 🚔😈';
else if (matchChance <= 92) nivel = 'Ship quase oficial com até apelido carinhoso no grupo 💞🔥';
else if (matchChance <= 93) nivel = 'Troca de packs secretos que fariam os moderadores suarem 🥵🔐';
else if (matchChance <= 94) nivel = 'Promessas indecentes e planos pra noite inteira de loucuras 🌙🔥';
else if (matchChance <= 95) nivel = 'Gemidão que ecoa no grupo inteiro, causando alvoroço 🔊🥵';
else if (matchChance <= 96) nivel = 'Sexo sincronizado com playlist apropriada e luzes vermelhas 💃🔴';
else if (matchChance <= 97) nivel = 'Prontos para morar juntinhos e criar uma mini gangue de gatos 🏡🐱🐱🐱';
else if (matchChance <= 98) nivel = 'Reservaram suíte especial no motel, a noite promete 🚗🍓🔥';
else if (matchChance <= 99) nivel = 'No limite do proibido: vão fazer até o porteiro pedir silêncio 🤫🍑';
else nivel = 'Sexo selvagem e aventuras Kamasutra versão masterclass 🧘‍♀️🔥🐅';



        const safadoEmoji = '💘🔥🥵';

        await chat.sendMessage('🔮 Calculando o match...');

        setTimeout(() => {
            const mention1Text = '@' + mention1Id.split('@')[0];
            const mention2Text = '@' + mention2Id.split('@')[0];

            const reply =
`╔═══ MATCH DETECTADO ═══╗
    ${safadoEmoji.repeat(3)}
╚═══════════════════════╝

${mention1Text} + ${mention2Text}

Chance de match: *${matchChance}%*
Nível de relacionamento: *${nivel}*

❤️ ${safadoEmoji} ❤️`;

            chat.sendMessage(reply, {
                mentions: [mention1Id, mention2Id]
            });
        }, 1500);
    }
};
