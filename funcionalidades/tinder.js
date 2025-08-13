module.exports = async (client, message) => {
    if (message.body.toLowerCase() === '/tinder') {
        const chat = await message.getChat();

        if (!chat.isGroup) {
            return message.reply('Esse comando só pode ser usado em grupos.');
        }

        // Lista de números bloqueados (sem nome visível)
        const numerosBloqueados = [
            '5511948172467',
            '554299690935',
            '554388490209',
            '554796313849',
            '556291470442',
            '556598000088',
            '556699775267',
            '5511976288716',
            '551191464625',
            '5521986202410',
            '5511943200958',
            '5521984965730'
        ];

        // Filtra os participantes válidos (exclui os bloqueados)
        const participants = chat.participants.filter(p =>
            p.id?.user && !numerosBloqueados.includes(p.id.user)
        );

        if (participants.length < 3) {
            return message.reply('Precisa de pelo menos 3 membros válidos no grupo para usar esse comando.');
        }

        // Sorteia duas pessoas diferentes
        let index1 = Math.floor(Math.random() * participants.length);
        let index2;
        do {
            index2 = Math.floor(Math.random() * participants.length);
        } while (index2 === index1);

        const person1 = participants[index1];
        const person2 = participants[index2];

        const mention1 = `@${person1.id.user}`;
        const mention2 = `@${person2.id.user}`;
        const matchChance = Math.floor(Math.random() * 101);

        // Níveis ousados
        let nivel = '';
        if (matchChance <= 3) nivel = 'Vibe de repulsa 🤮🚫';
        else if (matchChance <= 6) nivel = 'Vergonha alheia... nem o Tinder aceitaria 😬';
        else if (matchChance <= 9) nivel = 'Match NEGATIVO ❌ Nem com 4 garrafas de vodka... 🤢';
        else if (matchChance <= 12) nivel = 'Só na base da cachaça mesmo 🍺🤢';
        else if (matchChance <= 16) nivel = 'Sinal trocado 😬📵';
        else if (matchChance <= 20) nivel = 'Climão estranho... mas o tesão fala mais alto 😳🫦';
        else if (matchChance <= 24) nivel = 'Talvez numa festa estranha com gente esquisita 🤡';
        else if (matchChance <= 28) nivel = 'Crush platônico 👀💭';
        else if (matchChance <= 32) nivel = 'Olhares safados rolando... 👀👅';
        else if (matchChance <= 36) nivel = 'Tá rolando um flerte tímido... ou é ilusão? 👀';
        else if (matchChance <= 40) nivel = 'Tensão no ar 😏⚡';
        else if (matchChance <= 44) nivel = 'Vibe de pegação no rolê 🔥💋';
        else if (matchChance <= 46) nivel = 'Pega escondido no corredor do rolê 🔥👣';
        else if (matchChance <= 49) nivel = 'Tem clima, tem vontade, só falta coragem 😶‍🌫️';
        else if (matchChance <= 52) nivel = 'No escurinho do grupo... tudo pode acontecer 🌑💦';
        else if (matchChance <= 55) nivel = 'Uns nudes no sigilo já rolaram... 🤫📷';
        else if (matchChance <= 58) nivel = 'Se sair no rolê, vão se pegar com certeza 😏🍷';
        else if (matchChance <= 60) nivel = 'Já se pegaram no banheiro do rolê e ninguém sabe... ainda 🚽👀';
        else if (matchChance <= 62) nivel = 'Se olhar torto já é suficiente pra vir no privado 😏💦';
        else if (matchChance <= 64) nivel = 'Chamada de vídeo 2 da manhã? Já sabe 😈📞';
        else if (matchChance <= 66) nivel = 'Tesão acumulado desde 2020 😮‍💨🔥';
        else if (matchChance <= 68) nivel = 'Um oral bem dado resolveria essa tensão toda 😮🍆💦';
        else if (matchChance <= 70) nivel = 'Relacionamento sério à vista? 👩‍❤️‍👨💍';
        else if (matchChance <= 72) nivel = 'Fariam um vídeo que explodiria no Xvideos 🎥🔥';
        else if (matchChance <= 74) nivel = 'Tanta safadeza que nem o grupo dá conta 😈🍑';
        else if (matchChance <= 76) nivel = 'Já tem até nome de ship no grupo 💞';
        else if (matchChance <= 78) nivel = 'Já estão trocando packs enquanto você lê isso 📤🍆📸';
        else if (matchChance <= 80) nivel = 'Troca de packs e promessas indecentes 🔥📸🍆';
        else if (matchChance <= 82) nivel = 'Vocês transariam ouvindo gemidão do Zap 🔊🫦';
        else if (matchChance <= 84) nivel = 'Sexo com playlist e LED vermelho garantido 💋🛏️🔴';
        else if (matchChance <= 86) nivel = 'Sexo casual com carinho 🛏️💦💖';
        else if (matchChance <= 88) nivel = 'Prontos pra morar juntos e ter 3 gatos 🏠🐱';
        else if (matchChance <= 90) nivel = 'Motel? Já marcaram até suíte temática 🚗🍓🔞';
        else if (matchChance <= 94) nivel = 'Relacionamento enrolado 💑🥴📅';
        else if (matchChance <= 97) nivel = 'Já estão no “vai dar o c*?” e nem disfarçam mais 🤭🍑';
        else nivel = 'Sexo selvagem em todas as posições do Kamasutra 🧘‍♀️🔥🐅';
        
       

        const safadoEmoji = '💘🔥🥵';

        await chat.sendMessage('🔮 Calculando chances de match...');

        setTimeout(() => {
            const reply =
`╔═══ MATCH DETECTADO ═══╗
     ${safadoEmoji.repeat(3)}
╚═══════════════════════╝

${mention1} + ${mention2}

Chance de match: *${matchChance}%*
Nível de relacionamento: *${nivel}*

❤️ ${safadoEmoji} ❤️
`;

            chat.sendMessage(reply, {
                mentions: [person1.id._serialized, person2.id._serialized]
            });
        }, 1500);
    }
};
