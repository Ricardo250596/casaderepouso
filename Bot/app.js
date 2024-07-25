const venom = require("venom-bot");
const axios = require("axios");
const fs = require("fs"); // For file-based persistence

const API_KEY = "AIzaSyAehmHJ4I4A5WoJYsEoJx0WlV0mrJPiE2s";
const treinamentoDataPath = "./src/treinamento.json"; // Path to your training data

// Function to load training data from a JSON file
const loadTrainingData = async () => {
  try {
    const data = await fs.promises.readFile(treinamentoDataPath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading training data:", error);
    return {}; // Return an empty object if loading fails
  }
};

venom.create({
  session: "chatGPT_BOT",
  multidevice: true
})
.then(async (client) => {
  const treinamento = await loadTrainingData();
  start(client, treinamento);
})
.catch((err) => console.log(err));

const header = {
  "Content-Type": "application/json",
  "x-goog-api-key": API_KEY
};

const start = async (client, treinamento) => {
  client.onMessage((message) => {
    const user = banco.db.find((user) => user.num === message.from);

    // Handle user registration if not found
    if (!user) {
      console.log("Cadastrando usuário");
      banco.db.push({ num: message.from, historico: [] });
    }

    const userHistorico = user.historico;
    userHistorico.push("user: " + message.body);

    // Send user message and training data to Dialogflow for response generation
    axios.post("https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent", {
      contents: [
        { role: "user", parts: message.body },
        { role: "system", parts: treinamento },
        { role: "system", parts: "historico de conversas: " + userHistorico.join("\n") },
      ]
    }, {
      headers: header
    })
    .then((response) => {
      const assistantResponse = response.data.choices[0].message.content;
      userHistorico.push("assistent: " + assistantResponse);
      client.sendText(message.from, assistantResponse);
    })
    .catch((err) => {
      console.error("Error generating response:", err);
      client.sendText(message.from, "Desculpe, estou com problemas para te entender no momento. Tente novamente mais tarde.");
    });
  });
};
