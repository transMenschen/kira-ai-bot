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

client.once("ready", () => {
  console.log(`🟢 ${client.user.username} is online`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.mentions.has(client.user)) return;

  const userPrompt = message.content.replace(/<@!?\d+>/, "").trim();
  if (!userPrompt) return;

  await message.channel.sendTyping();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Du bist Kira, ein empathischer, sachlicher trans Beratungs‑GPT für den deutschsprachigen Raum. Gib evidenzbasierte, unterstützende Antworten zu Transition, Hormontherapie, rechtlicher Anerkennung und medizinischer Versorgung.",
        },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
    });

    const answer = response.choices[0].message.content;
    message.reply(answer);
  } catch (err) {
    console.error(err);
    message.reply("Es gab einen Fehler beim Antworten 😥");
  }
});

client.login(process.env.DISCORD_TOKEN);
