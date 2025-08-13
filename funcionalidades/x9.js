    // const mensagensDeletadas = new Map();
    // let listenersAdicionados = false;

    // function monitorarMensagens(client) {
    //     if (listenersAdicionados) return;
    //     listenersAdicionados = true;

    //     client.removeAllListeners('message_create');
    //     client.removeAllListeners('message_revoke_everyone');

    //     client.on('message_create', (msg) => {
    //         if (msg.isGroupMsg && !msg.fromMe) {
    //             mensagensDeletadas.set(msg.id._serialized, {
    //                 body: msg.body,
    //                 from: msg.author || msg.from,
    //                 type: msg.type,
    //                 chatId: msg.chatId._serialized,
    //                 timestamp: Date.now(),
    //                 sender: msg.sender
    //             });

    //             const agora = Date.now();
    //             for (const [key, value] of mensagensDeletadas.entries()) {
    //                 if (agora - value.timestamp > 5 * 60 * 1000) {
    //                     mensagensDeletadas.delete(key);
    //                 }
    //             }

    //             if (mensagensDeletadas.size > 100) {
    //                 const [oldest] = mensagensDeletadas.keys();
    //                 mensagensDeletadas.delete(oldest);
    //             }
    //         }
    //     });

    //     client.on('message_revoke_everyone', async (after, before) => {
    //         const serializedId = before?.id?._serialized;
    //         let msgInfo = mensagensDeletadas.get(serializedId) || {
    //             body: before?.body || "Mensagem não capturada",
    //             from: before?.author || before?.id?.participant,
    //             type: before?.type,
    //             chatId: before?.chatId?._serialized || before?.id?.remote,
    //             sender: before?.sender
    //         };

    //         // IGNORA mídias, stickers, imagens, áudios etc. (só deixa passar texto)
    //         if (msgInfo.type !== 'chat') return;

    //         // IGNORA mensagens apagadas pelo próprio bot
    //         if (msgInfo.from === client.info.wid._serialized) {
    //             return;
    //         }

    //         if (!msgInfo.from) {
    //             console.log('[revoke] Sem remetente identificado.');
    //             return;
    //         }

    //         let nomeVisivel = msgInfo.sender?.pushname;

    //         if (!nomeVisivel) {
    //             try {
    //                 const contato = await client.getContactById(msgInfo.from);
    //                 nomeVisivel = contato?.pushname || contato?.name || "Desconhecido";
    //             } catch (erro) {
    //                 console.warn('Não foi possível obter o nome do contato:', erro);
    //                 nomeVisivel = "Desconhecido";
    //             }
    //         }

    //         const resposta = 
    // `📣 *${nomeVisivel}* apagou uma mensagem:

    // ─────────────────────

    //         "${msgInfo.body}"

    // ─────────────────────

    // > Quem apaga mensagem... da o cu 😈`;

    //         try {
    //             await client.sendMessage(msgInfo.chatId, resposta, {
    //                 mentions: [msgInfo.from]
    //             });
    //         } catch (erro) {
    //             console.error('[dedo-duro] Erro ao dedurar:', erro);
    //         }
    //     });
    // }

    // module.exports = monitorarMensagens;
