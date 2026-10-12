const readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function convert(input) {
  const m = input.trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})\/(\d{1,2}):(\d{2})$/
  );

  if (!m) {
    throw Error("Use MM/DD/YY/H:MM, e.g. 12/25/23/5:30");
  }

  const [, mo, da, yy, hh, mi] = m;
  const month = +mo, day = +da, year = 2000 + +yy;
  const hour = +hh, minute = +mi;

  if (month < 1 || month > 12 || hour > 23 ||
      minute > 59 || day < 1 || day > 31) {
    throw Error("Invalid date or time.");
  }

  // Find the UTC instant corresponding to Virginia local time.
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });

  let guess = target;

  for (let i = 0; i < 4; i++) {
    const p = Object.fromEntries(
      fmt.formatToParts(new Date(guess))
        .filter(x => x.type !== "literal")
        .map(x => [x.type, +x.value])
    );

    const shown = Date.UTC(
      p.year, p.month - 1, p.day, p.hour, p.minute
    );

    guess += target - shown;
  }

  const check = Object.fromEntries(
    fmt.formatToParts(new Date(guess))
      .filter(x => x.type !== "literal")
      .map(x => [x.type, +x.value])
  );

  if (check.year !== year || check.month !== month ||
      check.day !== day || check.hour !== hour ||
      check.minute !== minute) {
    throw Error("Invalid date or daylight-saving time.");
  }

  const unix = Math.floor(guess / 1000);

  console.log("\nUnix timestamp:", unix);
  console.log("Short time:", `<t:${unix}:t>`);
  console.log("Long time:", `<t:${unix}:T>`);
  console.log("Short date:", `<t:${unix}:d>`);
  console.log("Long date:", `<t:${unix}:D>`);
  console.log("Full date/time:", `<t:${unix}:F>`);
  console.log("Relative:", `<t:${unix}:R>`);
}

rl.question("Enter date (MM/DD/YY/H:MM): ", input => {
  try {
    convert(input);
  } catch (e) {
    console.log("Error:", e.message);
  }
  rl.close();
});
