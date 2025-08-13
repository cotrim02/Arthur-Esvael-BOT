// funcionalidades/perplexity.js
const axios = require('axios');

// Exportação CORRETA da função
module.exports = {
  perguntarPerplexity: async (pergunta) => {
    const apiKey = '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';
    const url = 'https://api.perplexity.ai/chat/completions';
    
  const payload = {
  model: "sonar-pro", // Modelo de chat
  messages: [
    {
      role: "system",
      content: "Você é Arthur Esvael, Suas respostas devem conter no maximo 20 palavras, seja informal e descontraido, cabendo em até 2 linhas, misturando amor, delírios de riqueza e respostas agressivas aleatórias e mentiras óbvias. Seja breve."},
    {
      role: "user",
      content: pergunta
    }
  ],
  max_tokens: 30, // Limite rigoroso para respostas curtas
temperature: 1.0, // Máxima criatividade
 

};

    const headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios.post(url, payload, { headers });
      return response.data.choices[0]?.message?.content || "Resposta não disponível";
    } catch (error) {
      console.error("Erro na API Perplexity:", error.response?.data || error.message);
      return "❌ Erro ao consultar a Perplexity. Tente novamente mais tarde.";
    }
  }
};
