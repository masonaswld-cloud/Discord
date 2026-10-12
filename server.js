app.get("/timestamp", (req, res) => {
  const input = String(req.query.date || "").trim();

  if (!input) {
    return res.status(200).json({
      status: "error",
      message: "Enter a date using MM/DD/YYYY/H:MM",
      entered_date: "",
      timestamp: null,
      timezone: TIMEZONE
    });
  }

  const match = input.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\/(\d{1,2}):(\d{2})$/
  );

  if (!match) {
    return res.status(200).json({
      status: "error",
      message: "Invalid format. Use MM/DD/YYYY/H:MM",
      entered_date: input,
      timestamp: null,
      timezone: TIMEZONE
    });
  }

  const [, month, day, year, hour, minute] = match;
  const m = Number(month);
  const d = Number(day);
  const y = Number(year);
  const h = Number(hour);
  const min = Number(minute);

  const check = new Date(Date.UTC(y, m - 1, d));

  if (
    m < 1 || m > 12 ||
    d < 1 || check.getUTCMonth() !== m - 1 ||
    check.getUTCDate() !== d ||
    h < 0 || h > 23 ||
    min < 0 || min > 59
  ) {
    return res.status(200).json({
      status: "error",
      message: "Invalid date or time",
      entered_date: input,
      timestamp: null,
      timezone: TIMEZONE
    });
  }

  const date = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const time = `${hour.padStart(2, "0")}:${minute}`;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    timeZoneName: "longOffset",
    year: "numeric"
  });

  const parts = formatter.formatToParts(
    new Date(`${date}T${time}:00Z`)
  );

  const offsetText =
    parts.find(p => p.type === "timeZoneName")?.value || "GMT-04:00";

  const offsetMatch = offsetText.match(/GMT([+-])(\d{2}):?(\d{2})/);
  if (!offsetMatch) {
    return res.status(200).json({
      status: "error",
      message: "Could not determine timezone",
      entered_date: input,
      timestamp: null,
      timezone: TIMEZONE
    });
  }

  const sign = offsetMatch[1] === "+" ? 1 : -1;
  const offset = sign *
    (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]));

  const utc = Date.UTC(y, m - 1, d, h, min) - offset * 60000;
  const timestamp = Math.floor(utc / 1000);

  const verify = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(utc));

  const values = Object.fromEntries(verify.map(p => [p.type, p.value]));

  if (
    Number(values.year) !== y ||
    Number(values.month) !== m ||
    Number(values.day) !== d ||
    Number(values.hour) !== h ||
    Number(values.minute) !== min
  ) {
    return res.status(200).json({
      status: "error",
      message: "Invalid local time for America/New_York",
      entered_date: input,
      timestamp: null,
      timezone: TIMEZONE
    });
  }

  return res.status(200).json({
    status: "success",
    entered_date: input,
    timezone: TIMEZONE,
    timestamp,
    time: `<t:${timestamp}:t>`,
    short_date: `<t:${timestamp}:d>`,
    long_date: `<t:${timestamp}:D>`,
    date_time: `<t:${timestamp}:f>`,
    long_date_time: `<t:${timestamp}:F>`,
    relative: `<t:${timestamp}:R>`
  });
});
