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

module.exports = async (client, message) => {
    if (message.body.toLowerCase().startsWith('/match')) {
        const chat = await message.getChat();

        if (!chat.isGroup) {
            return message.reply('Esse comando só pode ser usado em grupos.');
        }

        const quemChamou = message.author.split('@')[0];
        const numerosBloqueados = getBlockedNumbers();
        const numerosCasados = getCasadosNumbers();

        // Verifica se mencionou alguém
        let alvoMatch = quemChamou;
        if (message.mentionedIds.length > 0) {
            alvoMatch = message.mentionedIds[0].split('@')[0];
        }

        // Verifica se algum dos envolvidos está casado
        if (numerosCasados.includes(quemChamou) || numerosCasados.includes(alvoMatch)) {
            return message.reply('💔 Esse match não pode acontecer... alguém aqui já é *casado(ª)*! 💍🚫');
        }

        // MATCH FORÇADO
        const FORCADO_1 = '5519997021557';
        const FORCADO_2 = '5511993821219';

        const isForcado =
            (alvoMatch === FORCADO_1 && quemChamou === FORCADO_2) ||
            (alvoMatch === FORCADO_2 && quemChamou === FORCADO_1) ||
            (alvoMatch === FORCADO_1 && quemChamou !== FORCADO_2) ||
            (alvoMatch === FORCADO_2 && quemChamou !== FORCADO_1) ||
            (quemChamou === FORCADO_1 && alvoMatch === quemChamou) ||
            (quemChamou === FORCADO_2 && alvoMatch === quemChamou);

        if (isForcado) {
            const mention1 = `@${FORCADO_1}`;
            const mention2 = `@${FORCADO_2}`;
            const matchChance = 100;
            const nivel = 'Sexo selvagem em todas as posições do Kamasutra 🧘‍♀️🔥🐅';
            const safadoEmoji = '💘🔥🥵';

            await chat.sendMessage('🔮 Calculando o match...');

            return setTimeout(() => {
                const reply =
`╔═══ MATCH DETECTADO═══╗
     ${safadoEmoji.repeat(3)}
╚═══════════════════════╝

${mention1} + ${mention2}

Chance de match: *${matchChance}%*
Nível de relacionamento: *${nivel}*

❤️ ${safadoEmoji} ❤️`;

                chat.sendMessage(reply, {
                    mentions: [
                        `${FORCADO_1}@c.us`,
                        `${FORCADO_2}@c.us`
                    ]
                });
            }, 1500);
        }

        // Participantes válidos
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

        const index = Math.floor(Math.random() * participants.length);
        const personRandom = participants[index];

        const mention1 = `@${alvoMatch}`;
        const mention2 = `@${personRandom.id.user}`;
        const matchChance = Math.floor(Math.random() * 101);

        let nivel = '';
        if (matchChance <= 5) nivel = 'Vergonha alheia... nem o Tinder aceitaria 😬';
        else if (matchChance <= 9) nivel = 'Match NEGATIVO ❌ Nem com 4 garrafas de vodka... 🤢';
        else if (matchChance <= 15) nivel = 'Só na base da cachaça mesmo 🍺🤢';
        else if (matchChance <= 24) nivel = 'Climão estranho... mas o tesão fala mais alto 😳🫦';
        else if (matchChance <= 28) nivel = 'Talvez numa festa estranha com gente esquisita 🤡';
        else if (matchChance <= 39) nivel = 'Olhares safados rolando... 👀👅';
        else if (matchChance <= 42) nivel = 'Tá rolando um flerte tímido... ou é ilusão? 👀';
        else if (matchChance <= 54) nivel = 'Vibe de pegação no rolê 🔥💋';
        else if (matchChance <= 56) nivel = 'Pega escondido no corredor do rolê 🔥👣';
        else if (matchChance <= 60) nivel = 'Tem clima, tem vontade, só falta coragem 😶‍🌫️';
        else if (matchChance <= 69) nivel = 'No escurinho do grupo... tudo pode acontecer 🌑💦';
        else if (matchChance <= 73) nivel = 'Uns nudes no sigilo já rolaram... 🤫📷';
        else if (matchChance <= 80) nivel = 'Se sair no rolê, vão se pegar com certeza 😏🍷';
        else if (matchChance <= 81) nivel = 'Já se pegaram no banheiro do rolê e ninguém sabe... ainda 🚽👀';
        else if (matchChance <= 83) nivel = 'Se olhar torto já é suficiente pra vir no privado 😏💦';
        else if (matchChance <= 84) nivel = 'Chamada de vídeo 2 da manhã? Já sabe 😈📞';
        else if (matchChance <= 85) nivel = 'Tesão acumulado desde 2020 😮‍💨🔥';
        else if (matchChance <= 87) nivel = 'Um oral bem dado resolveria essa tensão toda 😮🍆💦';
        else if (matchChance <= 88) nivel = 'Relacionamento sério à vista? 👩‍❤️‍👨💍';
        else if (matchChance <= 89) nivel = 'Fariam um vídeo que explodiria no Xvideos 🎥🔥';
        else if (matchChance <= 91) nivel = 'Tanta safadeza que nem o grupo dá conta 😈🍑';
        else if (matchChance <= 92) nivel = 'Já tem até nome de ship no grupo 💞';
        else if (matchChance <= 93) nivel = 'Já estão trocando packs enquanto você lê isso 📤🍆📸';
        else if (matchChance <= 94) nivel = 'Troca de packs e promessas indecentes 🔥📸🍆';
        else if (matchChance <= 95) nivel = 'Vocês transariam ouvindo gemidão do Zap 🔊🫦';
        else if (matchChance <= 96) nivel = 'Sexo com playlist e LED vermelho garantido 💋🛏️🔴';
        else if (matchChance <= 97) nivel = 'Prontos pra morar juntos e ter 3 gatos 🏠🐱';
        else if (matchChance <= 98) nivel = 'Motel? Já marcaram até suíte temática 🚗🍓🔞';
        else if (matchChance <= 99) nivel = 'Já estão no “vai dar o c*?” e nem disfarçam mais 🤭🍑';
        else nivel = 'Sexo selvagem em todas as posições do Kamasutra 🧘‍♀️🔥🐅';

        const safadoEmoji = '💘🔥🥵';

        await chat.sendMessage('🔮 Calculando o match...');

        setTimeout(() => {
            const reply =
`╔═══ MATCH DETECTADO ═══╗
     ${safadoEmoji.repeat(3)}
╚═══════════════════════╝

${mention1} + ${mention2}

Chance de match: *${matchChance}%*
Nível de relacionamento: *${nivel}*

❤️ ${safadoEmoji} ❤️`;

            chat.sendMessage(reply, {
                mentions: [
                    `${alvoMatch}@c.us`,
                    personRandom.id._serialized
                ]
            });
        }, 1500);
    }
};
