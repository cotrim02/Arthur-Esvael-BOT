const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const sharp = require('sharp');

/**
 * Converte o vídeo para um sticker WebP quadrado,
 * removendo barras laterais ou verticais via crop central automático.
 * @param {string} videoPath - Caminho para o arquivo de vídeo
 * @param {string} outputPath - Caminho para salvar o sticker WebP gerado
 * @returns {Promise}
 */
function convertVideoToSticker(videoPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoPath, (err, metadata) => {
            if (err) return reject(err);

            const videoStream = metadata.streams.find(s => s.codec_type === 'video');
            if (!videoStream) return resolve('IGNORADO'); // Não é vídeo

            const { width, height } = videoStream;
            const minDim = Math.min(width, height);

            const cropX = Math.floor((width - minDim) / 2);
            const cropY = Math.floor((height - minDim) / 2);

            const cropFilter = `crop=${minDim}:${minDim}:${cropX}:${cropY},scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000`;

            ffmpeg(videoPath)
                .setStartTime(0)
                .setDuration(6)
                .outputOptions(['-vf', cropFilter])
                .output(outputPath)
                .videoCodec('libwebp')
                .fps(10)
                .on('end', () => {
                    console.log(`✅ Sticker animado criado: ${outputPath}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error('❌ Erro ao converter vídeo para sticker:', err);
                    reject(err);
                })
                .run();
        });
    });
}

/**
 * Converte uma imagem estática para sticker WebP quadrado.
 * @param {Buffer} imageData - Dados da imagem em base64 ou buffer
 * @param {string} outputPath - Caminho para salvar o sticker
 * @returns {Promise}
 */
function convertImageToSticker(imageData, outputPath) {
    return new Promise(async (resolve, reject) => {
        try {
            await sharp(imageData)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 90, effort: 6 })
                .toFile(outputPath);

            console.log(`✅ Sticker estático criado: ${outputPath}`);
            resolve();
        } catch (err) {
            console.error('❌ Erro ao converter imagem para sticker:', err);
            reject(err);
        }
    });
}

module.exports = {
    convertVideoToSticker,
    convertImageToSticker
};
