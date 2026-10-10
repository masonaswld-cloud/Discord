const express = require("express");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  https.get("https://discord.com/blog/rss.xml", r => {
    let xml = "";
    r.on("data", d => xml += d);
    r.on("end", () => {
      const item = xml.match(/<item>([\s\S]*?)<\/item>/);
      if (!item) return res.json({ title: "", link: "" });

      const get = tag => {
        const m = item[1].match(
          new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)
        );
        return m ? m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim() : "";
      };

      res.json({
        title: get("title"),
        link: get("link")
      });
    });
  }).on("error", () => res.status(502).json({
    title: "",
    link: ""
  }));
});

app.listen(PORT, () => console.log("API online"));
