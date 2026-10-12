const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const TIMEZONE = "America/New_York";

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Timestamp API",
    timezone: TIMEZONE
  });
});

app.get("/timestamp", (req, res) => {
  const input = req.query.date;

  if (!input) {
    return res.status(400).json({
      error: "Missing date. Use /timestamp?date=10/12/2026/9:00"
    });
  }

  const match = String(input).match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\/(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return res.status(400).json({
      error: "Use MM/DD/YYYY/H:MM. Example: 10/12/2026/9:00"
    });
  }

  const [, m, d, y, h, min] = match;
  const month = Number(m);
  const day = Number(d);
  const year = Number(y);
  const hour = Number(h);
  const minute = Number(min);

  const option_date = `${month.toString().padStart(2, "0")}/${day.toString().padStart(2, "0")}/${year}/${hour.toString()}:${minute.toString().padStart(2, "0")}`;

  if (
    year < 1970 || year > 9999 ||
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    hour > 23 || minute > 59
  ) {
    return res.status(400).json({ error: "Invalid date or time." });
  }

  const calendar = new Date(0);
  calendar.setUTCFullYear(year, month - 1, day);
  calendar.setUTCHours(hour, minute, 0, 0);

  if (
    calendar.getUTCFullYear() !== year ||
    calendar.getUTCMonth() !== month - 1 ||
    calendar.getUTCDate() !== day
  ) {
    return res.status(400).json({ error: "That calendar date does not exist." });
  }

  // Find the matching UTC instant for New York local time.
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });

  const partsAt = ms => Object.fromEntries(
    fmt.formatToParts(new Date(ms))
      .filter(p => p.type !== "literal")
      .map(p => [p.type, Number(p.value)])
  );

  const utcMillis = (yy, mm, dd, hh, mi) => {
    const date = new Date(0);
    date.setUTCFullYear(yy, mm - 1, dd);
    date.setUTCHours(hh, mi, 0, 0);
    return date.getTime();
  };

  const wanted = utcMillis(year, month, day, hour, minute);
  let candidate = wanted;

  for (let i = 0; i < 6; i++) {
    const p = partsAt(candidate);
    const represented = utcMillis(
      p.year, p.month, p.day, p.hour, p.minute
    );
    const adjustment = wanted - represented;
    candidate += adjustment;
    if (adjustment === 0) break;
  }

  const actual = partsAt(candidate);

  if (
    actual.year !== year || actual.month !== month ||
    actual.day !== day || actual.hour !== hour ||
    actual.minute !== minute
  ) {
    return res.status(400).json({
      error: "This local time may not exist due to daylight saving time."
    });
  }

  const unix = Math.floor(candidate / 1000);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  });
  const formatted_local = formatter.format(new Date(candidate));

  res.json({
    status: "ok",
    input,
    option_date,
    timezone: TIMEZONE,
    unix,
    formatted_local,
    iso_utc: new Date(candidate).toISOString(),
    timestamps: {
      short_time: `<t:${unix}:t>`,
      long_time: `<t:${unix}:T>`,
      short_date: `<t:${unix}:d>`,
      long_date: `<t:${unix}:D>`,
      full: `<t:${unix}:F>`,
      relative: `<t:${unix}:R>`
    }
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Timestamp API running on port ${PORT}`);
});

