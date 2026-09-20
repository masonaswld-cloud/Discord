@app.route("/bans")
def bans():
    if not DISCORD_BOT_TOKEN:
        return jsonify({
            "status": "error",
            "message": "Discord bot token is not configured"
        }), 500

    url = f"https://discord.com/api/v10/guilds/{GUILD_ID}/bans"

    headers = {
        "Authorization": f"Bot {DISCORD_BOT_TOKEN}"
    }

    try:
        response = requests.get(url, headers=headers, timeout=15)

        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": "Could not get ban list",
                "discord_status": response.status_code
            }), response.status_code

        data = response.json()

        if not data:
            formatted = "🔨 **CURRENT BANNED USERS:** `0`\n\nNo banned users."

        else:
            lines = [
                f"🔨 **CURRENT BANNED USERS:** `{len(data)}`",
                ""
            ]

            for ban in data:
                user = ban.get("user", {})
                username = user.get("username", "Unknown")
                user_id = user.get("id", "Unknown")

                # Discord user mention
                lines.append(f"<@{user_id}> — `{username}`")

            formatted = "\n".join(lines)

        return jsonify({
            "response": formatted,
            "count": len(data)
        })

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500
