require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName("timestamp")
  .setDescription("Convert a Virginia date and time to a Discord timestamp")
  .addStringOption(option =>
    option
      .setName("date")
      .setDescription("MM/DD/YY/H:MM, e.g. 10/12/26/9:00")
      .setRequired(true)
  );

function convert(input) {
  const match = input.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})\/(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    throw new Error("Use MM/DD/YY/H:MM, e.g. 10/12/26/9:00");
  }

  const [, mo, da, yy, hh, mi] = match;
  const month = Number(mo);
  const day = Number(da);
  const year = 2000 + Number(yy);
  const hour = Number(hh);
  const minute = Number(mi);

  if (
    month < 1 || month > 12 || day < 1 || day > 31 ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) {
    throw new Error("Invalid date or time.");
  }

  const target = Date.UTC(year, month - 1, day, hour, minute);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  let guess = target;

  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(guess))
        .filter(p => p.type !== "literal")
        .map(p => [p.type, Number(p.value)])
    );

    guess += target - Date.UTC(
      parts.year, parts.month - 1, parts.day,
      parts.hour, parts.minute
    );
  }

  const check = Object.fromEntries(
    formatter.formatToParts(new Date(guess))
      .filter(p => p.type !== "literal")
      .map(p => [p.type, Number(p.value)])
  );

  if (
    check.year !== year || check.month !== month ||
    check.day !== day || check.hour !== hour ||
    check.minute !== minute ||
    new Date(target).getUTCMonth() !== month - 1 ||
    new Date(target).getUTCDate() !== day
  ) {
    throw new Error("Invalid date or daylight-saving time.");
  }

  return Math.floor(guess / 1000);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "timestamp") return;

  try {
    const unix = convert(interaction.options.getString("date"));

    await interaction.reply({
      content: [
        `**Unix timestamp:** \`${unix}\``,
        `**Short time:** <t:${unix}:t>`,
        `**Long time:** <t:${unix}:T>`,
        `**Short date:** <t:${unix}:d>`,
        `**Long date:** <t:${unix}:D>`,
        `**Full date/time:** <t:${unix}:F>`,
        `**Relative:** <t:${unix}:R>`,
        "",
        `**Copyable:** \`<t:${unix}:F>\``
      ].join("\n")
    });
  } catch (error) {
    await interaction.reply({
      content: `❌ ${error.message}`,
      ephemeral: true
    });
  }
});

async function main() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error("Add DISCORD_TOKEN and CLIENT_ID to your .env file.");
  }

  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: [command.toJSON()] }
  );

  console.log("Slash command registered.");
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(console.error);

require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const command = new SlashCommandBuilder()
  .setName("timestamp")
  .setDescription("Convert a Virginia date and time to a Discord timestamp")
  .addStringOption(option =>
    option
      .setName("date")
      .setDescription("MM/DD/YY/H:MM, e.g. 10/12/26/9:00")
      .setRequired(true)
  );

function convert(input) {
  const match = input.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})\/(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    throw new Error("Use MM/DD/YY/H:MM, e.g. 10/12/26/9:00");
  }

  const [, mo, da, yy, hh, mi] = match;
  const month = Number(mo);
  const day = Number(da);
  const year = 2000 + Number(yy);
  const hour = Number(hh);
  const minute = Number(mi);

  if (
    month < 1 || month > 12 || day < 1 || day > 31 ||
    hour < 0 || hour > 23 || minute < 0 || minute > 59
  ) {
    throw new Error("Invalid date or time.");
  }

  const target = Date.UTC(year, month - 1, day, hour, minute);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  let guess = target;

  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(guess))
        .filter(p => p.type !== "literal")
        .map(p => [p.type, Number(p.value)])
    );

    guess += target - Date.UTC(
      parts.year, parts.month - 1, parts.day,
      parts.hour, parts.minute
    );
  }

  const check = Object.fromEntries(
    formatter.formatToParts(new Date(guess))
      .filter(p => p.type !== "literal")
      .map(p => [p.type, Number(p.value)])
  );

  if (
    check.year !== year || check.month !== month ||
    check.day !== day || check.hour !== hour ||
    check.minute !== minute ||
    new Date(target).getUTCMonth() !== month - 1 ||
    new Date(target).getUTCDate() !== day
  ) {
    throw new Error("Invalid date or daylight-saving time.");
  }

  return Math.floor(guess / 1000);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "timestamp") return;

  try {
    const unix = convert(interaction.options.getString("date"));

    await interaction.reply({
      content: [
        `**Unix timestamp:** \`${unix}\``,
        `**Short time:** <t:${unix}:t>`,
        `**Long time:** <t:${unix}:T>`,
        `**Short date:** <t:${unix}:d>`,
        `**Long date:** <t:${unix}:D>`,
        `**Full date/time:** <t:${unix}:F>`,
        `**Relative:** <t:${unix}:R>`,
        "",
        `**Copyable:** \`<t:${unix}:F>\``
      ].join("\n")
    });
  } catch (error) {
    await interaction.reply({
      content: `❌ ${error.message}`,
      ephemeral: true
    });
  }
});

async function main() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error("Add DISCORD_TOKEN and CLIENT_ID to your .env file.");
  }

  const rest = new REST({ version: "10" })
    .setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: [command.toJSON()] }
  );

  console.log("Slash command registered.");
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(console.error);
