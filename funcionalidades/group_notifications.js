const GroupNotification = (client) => {
    // Armazena o momento de inicialização do bot (em milissegundos)
    const botStartTime = Date.now();
    
    const allowedGroups = [
        '120363380398336548@g.us', // ESVAELISTA ELITE DO MUNDO
        '120363417873563907@g.us', // Æ testes..
    ];

    const welcomeMessages = [
        '👅 Bem-vindo(a), NOME! Caiu na cova dos esvaelistas... agora já era 😈',
        '👅 Bem-vindo(a), NOME! Caiu na cova dos esvaelistas... agora já era 😈',
        '🌀 Bem-vindo(a), NOME! O esvaelismo corre nas veias desse grupo 🔥',
        '👁️‍🗨️ Bem-vindo(a), NOME! Arthur Esvael já previu sua chegada... agora se entregue 😏',
        '🔮 Bem-vindo(a), NOME! A profecia esvaelista se cumpriu mais uma vez...',
        '💀 Bem-vindo(a), NOME! Um novo discípulo do Esvaelismo entrou na orgia espiritual 😈',
        '🥴 Bem-vindo(a), NOME! Arthur Esvael te observa... e aprova sua entrada 😵‍💫',
        '🩸 Bem-vindo(a), NOME! Agora você faz parte da seita esvaelista. Sem volta. 😵',
        '👁️ Bem-vindo(a), NOME! O culto do Esvaelismo acaba de ganhar mais um(a) membro 🛐',
        '📜 Bem-vindo(a), NOME! Seu nome acaba de ser inscrito nos pergaminhos do esvaelismo eterno 🧙‍♂️',
        '🔥 Bem-vindo(a), NOME! Aqui é onde o Esvaelismo encontra a libertinagem 😈',
    ];

    const farewellMessages = [
        '😢 NOME se mandou... não tankou o bostil 😢',
        '🚪 NOME saiu... Covarde? 😒',
        '😢 NOME NAO FEZ O PIX... vai em paz!',
        '👢 NOME foi chutado(a) do grupo! Adeus, sem dó! 😈',
        '🔨 NOME foi expulso(a)! A casa não é bagunça 😤',
        '💥 Menos um(a) na orgia 🔞',
    ];

     const getRandom = arr => arr[Math.floor(Math.random() * arr.length)];

    // Função auxiliar para processar eventos
    const processEvent = async (notification, messages) => {
        const groupId = notification.chatId;
        if (!allowedGroups.includes(groupId)) return;

        // Ignora eventos anteriores ao start do bot (timestamp em segundos -> converte para ms)
        if (notification.timestamp * 1000 < botStartTime) return;

        const userId = notification.id.participant;

        try {
            const group = await client.getChatById(groupId);
            const contact = await client.getContactById(userId);
            const nome = contact.pushname || contact.name || userId.split('@')[0];
            const msg = getRandom(messages).replace(/NOME/g, nome);

          await client.sendMessage(groupId, msg, {
    mentions: [userId]
});

        } catch (err) {
            console.error(`Erro ao processar evento:`, err);
        }
    };

    // Entrada
    client.on('group_join', async notification => {
        await processEvent(notification, welcomeMessages);
    });

    // Saída
    client.on('group_leave', async notification => {
        await processEvent(notification, farewellMessages);
    });
};

module.exports = { GroupNotification };