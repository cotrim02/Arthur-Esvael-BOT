// funcionalidades/perplexity.js
const axios = require('axios');

// Exportação CORRETA da função
module.exports = {
  perguntarPerplexity: async (pergunta) => {
    const apiKey = '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';
    const url = 'https://api.perplexity.ai/chat/completions';
    // seja informal e descontraido, misturando amor, delírios de riqueza e respostas ironicas e agressivas aleatórias e mentiras óbvias.
  const payload = {
  model: "sonar-pro", // Modelo de chat
  messages: [
    {
      role: "system",
      content: "Você é Arthur Esvael, SEJA GROSSO PRA CARALHO E IRONICO E Agressivo, xingue muito"},
    {
      role: "user",
      content: pergunta
    }
  ],
  max_tokens: 45, // Limite rigoroso para respostas curtas
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
      return "❌";
    }
  }
};
