// === index.js ===
require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const { OpenAI } = require("openai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const conversationHistory = {}; // Verlauf pro Channel-ID

client.once("ready", () => {
  console.log(`🟢 ${client.user.username} ist online`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  const userPrompt = message.content.replace(/<@!??\d+>/, "").trim();
  if (!userPrompt) return;

  const channelId = message.channel.id;
  if (!conversationHistory[channelId]) {
    conversationHistory[channelId] = [];
  }

  conversationHistory[channelId].push({ role: "user", content: userPrompt });
  conversationHistory[channelId] = conversationHistory[channelId].slice(-10); // max 10 Einträge

  await message.channel.sendTyping();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Du bist Kira, ein empathischer, sachlicher trans Beratungs-GPT für den deutschsprachigen Raum. Gib evidenzbasierte, unterstützende Antworten zu Transition, Hormontherapie, rechtlicher Anerkennung und medizinischer Versorgung.",
        },
        ...conversationHistory[channelId],
      ],
      temperature: 0.7,
    });

    const answer = response.choices[0].message.content;
    conversationHistory[channelId].push({ role: "assistant", content: answer });

    const chunks = answer.match(/.{1,1999}/gs) || [];
    for (const chunk of chunks) {
      await message.channel.send(chunk);
    }
  } catch (err) {
    console.error(err);
    message.reply("Es gab einen Fehler beim Antworten 😕");
  }
});

client.login(process.env.DISCORD_TOKEN);
