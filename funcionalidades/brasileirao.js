const axios = require('axios');
const dayjs = require('dayjs');
require('dayjs/locale/pt-br');
dayjs.locale('pt-br');

const API_KEY = '263851387241453c8d1f4b0e77bd733b';
const BASE_URL = 'https://api.football-data.org/v4';

// 📊 Tabela do Brasileirão
async function obterTabelaBrasileirao() {
  try {
    const response = await axios.get(`${BASE_URL}/competitions/BSA/standings`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    const tabela = response.data.standings[0].table;
    let mensagem = '*🏆 Tabela do Brasileirão Série A:*\n\n';

    tabela.slice(0, 10).forEach((time, index) => {
      let emoji = '⚪';
      if (index === 0) emoji = '🥇';
      else if (index < 4) emoji = '🔝';
      else if (index >= 16) emoji = '🔻';

      mensagem += `${emoji} *${index + 1}º* ${time.team.name} - *${time.points} pts*\n`;
    });

    return mensagem;
  } catch (error) {
    console.error('Erro ao obter tabela:', error);
    return '⚠️ Erro ao buscar a tabela do Brasileirão.';
  }
}

// 📅 Jogos do dia
async function obterJogosHoje() {
  try {
    const hoje = dayjs().format('YYYY-MM-DD');
    const response = await axios.get(`${BASE_URL}/competitions/BSA/matches?dateFrom=${hoje}&dateTo=${hoje}`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    const partidas = response.data.matches;

    if (partidas.length === 0) return '⚽ Não há jogos do Brasileirão hoje.';

    let mensagem = '*📅 Jogos do Brasileirão hoje:*\n\n';

    partidas.forEach(jogo => {
      const timeCasa = jogo.homeTeam.name;
      const timeFora = jogo.awayTeam.name;
      const horario = dayjs(jogo.utcDate).format('HH:mm');

      mensagem += `🕒 *${horario}* - ${timeCasa} x ${timeFora}\n`;
    });

    return mensagem;
  } catch (error) {
    console.error('Erro ao obter jogos:', error);
    return '⚠️ Erro ao buscar os jogos de hoje.';
  }
}

// 🔮 Próxima Rodada do Brasileirão
async function obterProximaRodada() {
  try {
    const response = await axios.get(`${BASE_URL}/competitions/BSA/matches`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    const jogosFuturos = response.data.matches.filter(jogo => jogo.status === 'SCHEDULED');

    if (jogosFuturos.length === 0) {
      return '⚽ Não há próximos jogos agendados no momento.';
    }

    // Agrupa os jogos pela data mais próxima
    const dataMaisProxima = dayjs(jogosFuturos[0].utcDate).format('YYYY-MM-DD');
    const proximaRodada = jogosFuturos.filter(jogo =>
      dayjs(jogo.utcDate).format('YYYY-MM-DD') === dataMaisProxima
    );

    let mensagem = `*🔮 Próxima rodada do Brasileirão (${dayjs(dataMaisProxima).format('DD/MM')}):*\n\n`;

    proximaRodada.forEach(jogo => {
      const timeCasa = jogo.homeTeam.name;
      const timeFora = jogo.awayTeam.name;
      const horario = dayjs(jogo.utcDate).format('HH:mm');

      mensagem += `🕒 *${horario}* - ${timeCasa} x ${timeFora}\n`;
    });

    return mensagem;
  } catch (error) {
    console.error('Erro ao obter próxima rodada:', error);
    return '⚠️ Erro ao buscar a próxima rodada.';
  }
}

module.exports = {
  obterTabelaBrasileirao,
  obterJogosHoje,
  obterProximaRodada
};
