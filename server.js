const express = require("express");
const app = express();
const PORT = process.env.PORT || 10000;
const TIMEZONE = "America/New_York";

app.get("/", (req, res) => {
  res.json({
    status: "online",
    service: "Timestamp API",
    timezone: TIMEZONE,
    format: "MM/DD/YYYY/H:MM",
    example: "/timestamp?date=10%2F12%2F2026%2F9%3A00"
  });
});

app.get("/timestamp", (req, res) => {
  const input = Array.isArray(req.query.date)
    ? req.query.date[0]
    : req.query.date;

  if (!input) {
    return res.status(400).json({
      status: "error",
      error: "Missing date.",
      expected_format: "MM/DD/YYYY/H:MM",
      example: "10/12/2026/9:00"
    });
  }

  const match = String(input).trim().match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\/(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return res.status(400).json({
      status: "error",
      input,
      error: "Invalid format. Use MM/DD/YYYY/H:MM.",
      example: "10/12/2026/9:00"
    });
  }

  const [, m, d, y, h, min] = match;
  const month = Number(m);
  const day = Number(d);
  const year = Number(y);
  const hour = Number(h);
  const minute = Number(min);

  if (
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    year < 1970 || year > 9999 ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return res.status(400).json({
      status: "error",
      input,
      error: "Invalid date or time."
    });
  }

  const calendarDate = new Date(Date.UTC(year, month - 1, day));

  if (
    calendarDate.getUTCFullYear() !== year ||
    calendarDate.getUTCMonth() !== month - 1 ||
    calendarDate.getUTCDate() !== day
  ) {
    return res.status(400).json({
      status: "error",
      input,
      error: "Invalid calendar date."
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

  const toParts = (ms) => {
    const parts = formatter.formatToParts(new Date(ms));
    return Object.fromEntries(
      parts
        .filter(part => part.type !== "literal")
        .map(part => [part.type, Number(part.value)])
    );
  };

  const asUTC = (yy, mm, dd, hh, mi) => {
    const date = new Date(0);
    date.setUTCFullYear(yy, mm - 1, dd);
    date.setUTCHours(hh, mi, 0, 0);
    return date.getTime();
  };

  const target = asUTC(year, month, day, hour, minute);
  let candidate = target;

  for (let i = 0; i < 6; i++) {
    const p = toParts(candidate);
    const difference = target - asUTC(
      p.year, p.month, p.day, p.hour, p.minute
    );

    candidate += difference;

    if (difference === 0) break;
  }

  const actual = toParts(candidate);

  if (
    actual.year !== year ||
    actual.month !== month ||
    actual.day !== day ||
    actual.hour !== hour ||
    actual.minute !== minute
  ) {
    return res.status(400).json({
      status: "error",
      input,
      error: "This local time may not exist because of daylight saving time."
    });
  }

  const unix = Math.floor(candidate / 1000);

  res.json({
    status: "ok",
    input: String(input).trim(),
    timezone: TIMEZONE,
    unix,
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
