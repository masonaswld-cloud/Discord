const readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const TIME_ZONE = "America/New_York";

function partsFor(instantMillis) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  return Object.fromEntries(
    fmt.formatToParts(new Date(instantMillis))
      .filter(x => x.type !== "literal")
      .map(x => [x.type, +x.value])
  );
}

function findEpochForLocal(year, month, day, hour, minute) {
  const dayUtcMidnight = Date.UTC(year, month - 1, day, 0, 0);
  const windowMs = 36 * 60 * 60 * 1000;
  const stepMs = 60 * 1000;
  const matches = [];

  for (let t = dayUtcMidnight - windowMs; t <= dayUtcMidnight + windowMs; t += stepMs) {
    const p = partsFor(t);
    if (
      p.year === year &&
      p.month === month &&
      p.day === day &&
      p.hour === hour &&
      p.minute === minute
    ) {
      matches.push(t);
      if (matches.length > 4) break;
    }
  }

  if (matches.length === 0) {
    throw Error("Invalid date or daylight-saving time (the specified wall-clock time does not exist in the target timezone).");
  }

  if (matches.length > 1) {
    console.log("Warning: Local time is ambiguous due to end of daylight saving time — choosing the earlier occurrence.");
  }

  return matches[0];
}

function convert(input) {
  const m = input.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\/(\d{1,2}):(\d{2})$/
  );

  if (!m) {
    throw Error("Use MM/DD/YY or MM/DD/YYYY/H:MM, e.g. 12/25/23/5:30 or 12/25/2023/5:30");
  }

  const [, mo, da, yy, hh, mi] = m;
  const month = +mo, day = +da;
  let year = +yy;
  let optionDate = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${yy}/${hh}:${mi}`;
  if (yy.length === 2) {
    year = 2000 + year;
    optionDate = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year}/${hh}:${mi}`;
  }
  const hour = +hh, minute = +mi;

  if (month < 1 || month > 12 || hour > 23 || minute > 59 || day < 1 || day > 31) {
    throw Error("Invalid date or time.");
  }

  const test = new Date(year, month - 1, day);
  if (
    test.getFullYear() !== year ||
    test.getMonth() !== month - 1 ||
    test.getDate() !== day
  ) {
    throw Error("Invalid day for the month.");
  }

  const epochMillis = findEpochForLocal(year, month, day, hour, minute);
  const unix = Math.floor(epochMillis / 1000);

  console.log("\nSelected date:", optionDate);
  console.log("Unix timestamp:", unix);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  console.log("Formatted (America/New_York):", fmt.format(new Date(epochMillis)));
  console.log("ISO (UTC):", new Date(epochMillis).toISOString());
  console.log("Short time:", `<t:${unix}:t>`);
  console.log("Long time:", `<t:${unix}:T>`);
  console.log("Short date:", `<t:${unix}:d>`);
  console.log("Long date:", `<t:${unix}:D>`);
  console.log("Full date/time:", `<t:${unix}:F>`);
  console.log("Relative:", `<t:${unix}:R>`);
}

rl.question("Enter date (MM/DD/YY or MM/DD/YYYY/H:MM): ", input => {
  try {
    convert(input);
  } catch (e) {
    console.log("Error:", e.message);
  }
  rl.close();
});

