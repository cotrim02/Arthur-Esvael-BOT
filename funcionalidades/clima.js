const axios = require('axios');
const API_KEY = '30e742d553e01a6e39b5eaef18fc7557'; // Coloque sua chave da OpenWeather aqui

async function getPrevisao(cidade) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade},BR&appid=${API_KEY}&lang=pt_br&units=metric`;

    try {
        const response = await axios.get(url);
        const dados = response.data;

        const descricao = dados.weather[0].description;
        const temp = dados.main.temp;
        const sensacao = dados.main.feels_like;
        const umidade = dados.main.humidity;

        return `☁️ *Previsão do tempo para ${cidade}*\n\n🌡 Temperatura: *${temp}°C*\n🥵 Sensação térmica: *${sensacao}°C*\n💧 Umidade: *${umidade}%*\n📋 Clima: *${descricao}*`;
    } catch (err) {
        return '❌ Cidade não encontrada ou erro ao buscar dados.';
    }
}

module.exports = { getPrevisao };
