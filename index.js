const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// Importação dos módulos

const { calabocaCommand, onMessage } = require('./funcionalidades/calaboca.js');
const perplexityModule = require('./funcionalidades/perplexity.js');
const perguntarPerplexity = perplexityModule.perguntarPerplexity;
const setupRoleta = require('./funcionalidades/roleta.js');
const { sendAudio } = require('./funcionalidades/audio_sender.js');
const frasesArthurEsvael = require('./funcionalidades/frases_arthur.js');
const todos = require('./funcionalidades/todos.js');
const { getPrevisao } = require('./funcionalidades/clima.js');
const tinder = require('./funcionalidades/tinder.js');
const { obterTabelaBrasileirao, obterJogosHoje, obterProximaRodada } = require('./funcionalidades/brasileirao.js');
const matchCommand = require('./funcionalidades/match.js');
    const monitorarMensagens = require('./funcionalidades/x9.js');
const textoAjuda = require('./funcionalidades/ajuda.js');
const { contarMensagens } = require('./funcionalidades/messageCounter.js');
const { contadorGM } = require('./Contadores/contador_gm.js');
const { contadorJN } = require('./Contadores/contador_jn.js');
const { contadorGAB } = require('./Contadores/contador_gab.js');
const { contadorfrank } = require('./Contadores/contador_frank.js');
const { contadorJV } = require('./Contadores/contador_jv.js');
const { initializeAudioReenviador } = require('./funcionalidades/audio_reenviador.js');
const bloquear = require('./funcionalidades/block.js'); 
const { reagirAMensagem } = require('./funcionalidades/botReacao.js');
const sharp = require('sharp'); 
const { acervoRespostas } = require('./funcionalidades/acervoRespostas.js');
const { GroupNotification } = require('./funcionalidades/group_notifications.js');
const { convertVideoToSticker } = require('./funcionalidades/convertToSticker.js');

// Definição de pastas
const MIDIAS_DIR = path.join(__dirname, 'midias');
const STICKERS_DIR = path.join(__dirname, 'stickers');
const LIMITE_ARQUIVOS = 4;

// Crie as pastas se não existirem
if (!fs.existsSync(MIDIAS_DIR)) fs.mkdirSync(MIDIAS_DIR);
if (!fs.existsSync(STICKERS_DIR)) fs.mkdirSync(STICKERS_DIR);

// Função para limpar pastas
function limparPastasSeNecessario() {
    [MIDIAS_DIR, STICKERS_DIR].forEach(dir => {
        if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir);
            if (files.length >= LIMITE_ARQUIVOS) {
                files.forEach(file => fs.unlinkSync(path.join(dir, file)));
                console.log(`🧹 ${path.basename(dir)} resetada`);
            }
        }
    });
}

// Limpeza agressiva de cache
const clearOldCache = () => {
    const cacheDirs = [
        path.join(__dirname, '.wwebjs_cache'),
        MIDIAS_DIR,
        STICKERS_DIR
    ];
    
    cacheDirs.forEach(dir => {
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, { recursive: true, force: true });
            console.log(`🧹 Cache limpo: ${path.basename(dir)}`);
            fs.mkdirSync(dir); // Recria a pasta
        }
    });
};

// Executa imediatamente ao iniciar
clearOldCache();

// Inicializando o cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage'
        ]
    }
});

// Configura testeroleta ANTES de inicializar
setupRoleta(client)

// Controle de inicialização
let isInitialized = false;
let initializationTimeout;


client.on('qr', (qr) => {
    console.log("Escaneie este QR Code para conectar:");
    qrcode.generate(qr, { small: true });
});



GroupNotification(client);

// Evento quando o cliente estiver pronto
client.on('ready', async () => {
    console.log('✅ Bot conectado ao WhatsApp!');
    try {
        const chats = await client.getChats();
        const grupos = chats.filter(chat => chat.isGroup);

        console.log('\n📋 LISTA DE GRUPOS DETECTADOS AO INICIAR:\n');
        grupos.forEach((grupo, i) => {
            console.log(`${i + 1}. ${grupo.name} => ${grupo.id._serialized}`);
        });
        console.log('\n📋 FIM DA LISTA DE GRUPOS\n');
    } catch (error) {
        console.error('❌ Erro ao buscar grupos:', error);
    }

    

    // Delay de 10s para estabilização
    console.log('⏳ Aguardando 10s para estabilização...');
    initializationTimeout = setTimeout(() => {
        isInitialized = true;
        console.log('✅ Bot estabilizado e pronto para processar mensagens');
        initializeAudioReenviador(client);
    }, 5000);
});

// Evento para monitorar as mensagens (ÚNICO)
client.on('message', async (message) => {
    // Ignora mensagens durante estabilização
    if (!isInitialized) {
        console.log(`⏳ Ignorando mensagem durante inicialização: ${message.body}`);
        return;
    }

    // Filtro de mensagens antigas (>5 minutos)
    const messageAge = Date.now() - message.timestamp * 1000;
    if (messageAge > 300000) {
        console.log(`⏳ Ignorando mensagem antiga (${Math.floor(messageAge/60000)} min): ${message.body}`);
        return;
    }

      if (/^\/xiu\d*\s/i.test(message.body)) {
        await calabocaCommand(client, message);
        return; // Para evitar processar outros comandos na mesma mensagem
    }
    // --- FIM: Comando /xiu ---

    // ... (restante dos seus comandos e funcionalidades) ...

    // Sempre verifica se o autor está silenciado
    await onMessage(client, message);

   try {
    console.log(`📩 Nova mensagem: ${message.body} | De: ${message.from}`);

    // ✅ Nova lógica: Responde quando mencionado ou em reply ao bot
    const numeroBot = '5511991074272@c.us';
    
    // Verifica menção
    const isMentioned = message.mentionedIds && message.mentionedIds.includes(numeroBot);
    
    // Verifica se é reply ao bot
    let isReplyToBot = false;
    if (message.hasQuotedMsg) {
        try {
            const quotedMsg = await message.getQuotedMessage();
            isReplyToBot = quotedMsg.fromMe;
        } catch (e) {
            console.error('Erro ao verificar quoted message:', e);
        }
    }

    // Aciona IA se menção OU reply ao bot
    if (isMentioned || isReplyToBot) {
        try {
            // Remove menção se existir
            let pergunta = message.body;
            if (isMentioned) {
                const botMention = `@${numeroBot.split('@')[0]}`;
                pergunta = pergunta.replace(botMention, '').trim();
            }
            
            // Usa IA para responder
            const resposta = await perguntarPerplexity(pergunta);
            
            // Responde mencionando o remetente
            const remetente = message.author || message.from;
            await client.sendMessage(
                message.from, 
                resposta, 
                { mentions: [remetente] }
            );
        } catch (error) {
            console.error('❌ Erro no Perplexity:', error);
            await message.reply('❌ Ops, deu ruim aqui. Tenta de novo?');
        }
        return; // Interrompe processamento adicional
    }


        // Funções principais
        await sendAudio(message, client);
        await todos(client, message);
        await tinder(client, message);
        await bloquear(client, message);
        await matchCommand(client, message);
        await contarMensagens(message, client);
        await contadorGM(client, message);
        await contadorJN(client, message);
        await contadorGAB(client, message);
        await contadorfrank(client, message);
        await contadorJV(client, message);
       


        // Reações com timeout
        await Promise.race([
            reagirAMensagem(message),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout reação')), 5000)
            )
        ]);
        
        // // CORREÇÃO: Removido .catch() para função síncrona
        // monitorarMensagens(client);

    } catch (error) {
        console.error('❌ Erro no processamento:', error.message);
    }

    // Comandos de sticker de vídeo
    const body = message.body.trim().toLowerCase();
    const isCmd = body === '/sa' || body === '/stickera';

    if (isCmd) {
        try {
            let mediaMessage = message;

            if (message.hasQuotedMsg) {
                const quoted = await message.getQuotedMessage();
                if (quoted.hasMedia && quoted.type === 'video') {
                    mediaMessage = quoted;
                }
            }

            if (!mediaMessage.hasMedia) {
                return;
            }

            const media = await mediaMessage.downloadMedia();
            if (!media || !media.mimetype.startsWith('video/')) {
                return;
            }

            const timestamp = Date.now();
            const ext = media.mimetype === 'video/webm' ? 'webm' : 'mp4';
            const videoPath = path.join(MIDIAS_DIR, `video_${timestamp}.${ext}`);
            const stickerPath = path.join(STICKERS_DIR, `sticker_${timestamp}.webp`);

            fs.writeFileSync(videoPath, Buffer.from(media.data, 'base64'));
            await convertVideoToSticker(videoPath, stickerPath);

            if (fs.existsSync(stickerPath)) {
                const stickerMedia = MessageMedia.fromFilePath(stickerPath);
                await message.reply(stickerMedia, null, { sendMediaAsSticker: true });
            }

            limparPastasSeNecessario();

        } catch (err) {
            console.error('Erro no sticker dinâmico:', err);
        }
    }

    // Comandos de sticker de imagem
    const isImageStickerCmd = body === '/s' || body === '/sticker';
    if (isImageStickerCmd) {
        try {
            let mediaMessage = message;

            if (message.hasQuotedMsg) {
                const quoted = await message.getQuotedMessage();
                if (quoted.hasMedia && quoted.type === 'image') {
                    mediaMessage = quoted;
                }
            }

            if (!mediaMessage.hasMedia) {
                return;
            }

            const media = await mediaMessage.downloadMedia();
            if (!media || !media.mimetype.startsWith('image/')) {
                return;
            }

            const timestamp = Date.now();
            const imagePath = path.join(MIDIAS_DIR, `imagem_${timestamp}.jpg`);
            const webpPath = path.join(STICKERS_DIR, `sticker_${timestamp}.webp`);

            fs.writeFileSync(imagePath, Buffer.from(media.data, 'base64'));
            await sharp(imagePath)
                .resize(512, 512, { fit: 'cover', position: 'center' })
                .webp()
                .toFile(webpPath);

            const stickerMedia = MessageMedia.fromFilePath(webpPath);
            await message.reply(stickerMedia, null, { sendMediaAsSticker: true });

            limparPastasSeNecessario();
        } catch (err) {
            console.error('Erro no sticker estático:', err);
        }
    }

    // Comandos de brasileirão
    if (message.body === '/brasileirao') {
        const resposta = await obterTabelaBrasileirao();
        client.sendMessage(message.from, resposta);
    }

    if (message.body === '/jogos') {
        const resposta = await obterJogosHoje();
        client.sendMessage(message.from, resposta);
    }

    if (message.body === '/proxima') {
        const resposta = await obterProximaRodada();
        client.sendMessage(message.from, resposta);
    }

    if (message.body === "/help") {
        await message.reply(textoAjuda);
    }

    if (message.body.startsWith('/clima')) {
        const partes = message.body.split(' ');
        const cidade = partes.slice(1).join(' ');

        if (!cidade) {
            return await message.reply('❗ Use: `/clima cidade`\nEx: `/clima São Paulo`');
        }

        const resposta = await getPrevisao(cidade);
        await message.reply(resposta);
    }

  if (message.body === "/h") {
    const readMore = '​'.repeat(1500); // Caractere invisível
    let resposta = `\n📂 *Acervo Æ 😻*${readMore}\n\n `;
    for (const [key, title] of Object.entries(acervoRespostas)) {
        resposta += `/${key} - ${title}\n`;
    }
    // Adiciona o link ao final da resposta
    resposta += `\nAcesse o acervo completo aqui: https://drive.google.com/drive/folders/1WP-ez3MbNbZAbnkvBy_HQMmBPeCCc7Zp`;
    
    await message.reply(resposta);
}


    if (message.body === '/fortuna') {
        const agora = new Date();
        const dataFinal = new Date('2025-06-02T00:00:00');
        const tempoRestante = dataFinal - agora;

        const segundos = Math.floor((tempoRestante / 1000) % 60);
        const minutos = Math.floor((tempoRestante / 1000 / 60) % 60);
        const horas = Math.floor((tempoRestante / 1000 / 60 / 60) % 24);
        const diasTotais = Math.floor(tempoRestante / (1000 * 60 * 60 * 24));
        const meses = Math.floor(diasTotais / 30);
        const dias = diasTotais % 30;

        const resposta = `⏳ Faltam *${meses} mês${meses !== 1 ? 'es' : ''}, ${dias} dia${dias !== 1 ? 's' : ''}, ${horas} hora${horas !== 1 ? 's' : ''}, ${minutos} minuto${minutos !== 1 ? 's' : ''} e ${segundos} segundo${segundos !== 1 ? 's' : ''}* para Arthur Esvael se tornar *BILIONÁRIO!* 💸🚀`;
        await message.reply(resposta);
    }

    const numeroBot = '5511991074272@c.us';

    // Respostas automáticas
    if (message.mentionedIds && message.mentionedIds.includes(numeroBot)) {
        const fraseAleatoria = frasesArthurEsvael[Math.floor(Math.random() * frasesArthurEsvael.length)];
        await client.sendMessage(message.from, fraseAleatoria);
    }

    if (message.body.toLowerCase().includes('te amo')) {
        const remetente = message.author || message.from;
        const mencao = [remetente];
        const textoTeAmo = `TE AMO @${remetente.split('@')[0]}, TE AMO!`;
        await client.sendMessage(message.from, textoTeAmo, { mentions: mencao });
    }
});

// Reinício seguro
process.on('SIGINT', async () => {
    if (initializationTimeout) clearTimeout(initializationTimeout);
    console.log('♻️ Encerrando cliente...');
    await client.destroy();
    console.log('✅ Cliente encerrado');
    process.exit(0);
});

client.setMaxListeners(20);
client.initialize();
