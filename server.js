const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;
const TIMEZONE = "America/New_York";

function makeTimestamps(unix) {
  return {
    short_time: `<t:${unix}:t>`,
    long_time: `<t:${unix}:T>`,
    short_date: `<t:${unix}:d>`,
    long_date: `<t:${unix}:D>`,
    full: `<t:${unix}:F>`,
    relative: `<t:${unix}:R>`
  };
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Timestamp API",
    timezone: TIMEZONE,
    format: "MM/DD/YYYY/H:MM"
  });
});

app.get("/timestamp", (req, res) => {
  const input = Array.isArray(req.query.date)
    ? req.query.date[0]
    : req.query.date;

  if (!input) {
    return res.status(400).json({
      status: "error",
      error: "Missing date. Pass the BotGhost option as ?date={option_date}.",
      expected_format: "MM/DD/YYYY/H:MM",
      timezone: TIMEZONE
    });
  }

  const cleanInput = String(input).trim();
  const match = cleanInput.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\/(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return res.status(400).json({
      status: "error",
      input: cleanInput,
      error: "Invalid format. Use MM/DD/YYYY/H:MM.",
      expected_format: "MM/DD/YYYY/H:MM",
      timezone: TIMEZONE
    });
  }

  const [, m, d, y, h, min] = match;
  const month = Number(m);
  const day = Number(d);
  const year = Number(y);
  const hour = Number(h);
  const minute = Number(min);

  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);

  if (
    year < 1970 || year > 9999 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return res.status(400).json({
      status: "error",
      input: cleanInput,
      error: "Invalid date or time.",
      timezone: TIMEZONE
    });
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const partsAt = ms => Object.fromEntries(
    formatter.formatToParts(new Date(ms))
      .filter(p => p.type !== "literal")
      .map(p => [p.type, Number(p.value)])
  );

  const asUTC = (yy, mm, dd, hh, mi) => {
    const date = new Date(0);
    date.setUTCFullYear(yy, mm - 1, dd);
    date.setUTCHours(hh, mi, 0, 0);
    return date.getTime();
  };

  const target = asUTC(year, month, day, hour, minute);
  let candidate = target;

  for (let i = 0; i < 6; i++) {
    const p = partsAt(candidate);
    const difference = target -
      asUTC(p.year, p.month, p.day, p.hour, p.minute);

    candidate += difference;
    if (difference === 0) break;
  }

  const actual = partsAt(candidate);

  if (
    actual.year !== year ||
    actual.month !== month ||
    actual.day !== day ||
    actual.hour !== hour ||
    actual.minute !== minute
  ) {
    return res.status(400).json({
      status: "error",
      input: cleanInput,
      error: "This local time may not exist because of daylight saving time.",
      timezone: TIMEZONE
    });
  }

  const unix = Math.floor(candidate / 1000);

  return res.json({
    status: "ok",
    input: cleanInput,
    timezone: TIMEZONE,
    unix,
    timestamps: makeTimestamps(unix)
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Timestamp API running on port ${PORT}`);
});
