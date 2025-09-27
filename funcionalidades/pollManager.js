const { Poll } = require('whatsapp-web.js');

const questions = [
  {
    pollName: "Quais os CIDS da psiquiatra do Arthur?",
    pollOptions: [
      { name: "TRANSTORNO DEPRESSIVO" },
      { name: "" },
      { name: "Vermelho" }
    ],
    allowMultipleAnswers: false,
    correctAnswerIndex: 1 // Verde
  },
  {
    pollName: "Qual seu esporte preferido?",
    pollOptions: [
      { name: "Futebol" },
      { name: "Basquete" },
      { name: "Vôlei" },
      { name: "Tênis" }
    ],
    allowMultipleAnswers: false,
    correctAnswerIndex: 0 // Futebol
  },
  {
    pollName: "Qual seu animal favorito?",
    pollOptions: [
      { name: "Gato" },
      { name: "Cachorro" },
      { name: "Pássaro" },
      { name: "Peixe" }
    ],
    allowMultipleAnswers: true,
    correctAnswerIndex: 1 // Cachorro, apenas para referência
  },
  {
    pollName: "Qual destas linguagens de programação você prefere?",
    pollOptions: [
      { name: "JavaScript" },
      { name: "Python" },
      { name: "Java" },
      { name: "C++" }
    ],
    allowMultipleAnswers: false,
    correctAnswerIndex: 0 // JavaScript
  }
  // Pode adicionar mais enquetes aqui seguindo este modelo
];

let currentIndex = 0;

function getCurrentQuestion() {
  if (currentIndex >= questions.length) currentIndex = 0;
  return questions[currentIndex];
}

function advanceQuestion() {
  currentIndex++;
  if (currentIndex >= questions.length) currentIndex = 0;
}

async function enviarEnquete(chat) {
  const question = getCurrentQuestion();
  const poll = new Poll(
    question.pollName,
    question.pollOptions.map(o => o.name),
    {
      allowMultipleAnswers: question.allowMultipleAnswers || false,
    }
  );

  await chat.sendMessage(poll);
}

module.exports = {
  enviarEnquete,
  advanceQuestion,
  getCurrentQuestion
};
