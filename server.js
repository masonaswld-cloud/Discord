
const express = require("express");

const app = express();
const PORT = process.env.PORT || 10000;
const FEED = "https://discord.com/blog/rss.xml";

app.get("/", (req, res) => {
  res.json({ status: "online", api: "Discord Updates API" });
});

app.get("/discord-updates", async (req, res) => {
  try {
    const response = await fetch(FEED);
    if (!response.ok) throw new Error("Discord RSS unavailable");

    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
      .slice(0, 10)
      .map(([_, item]) => {
        const get = (tag) => {
          const match = item.match(
            new RegExp(`<${tag}[^>]*>([\\\\s\\\\S]*?)<\\\\/${tag}>`, "i")
          );
          return match ? match[1]
            .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">").trim() : "";
        };
        return {
          title: get("title"),
          link: get("link"),
          description: get("description"),
          pubDate: get("pubDate")
        };
      });

    res.json({ status: "ok", count: items.length, items });
  } catch (error) {
    res.status(502).json({ status: "error", message: error.message });
  }
});

app.listen(PORT, () => console.log(`API running on ${PORT}`));
