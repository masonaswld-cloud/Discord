from flask import Flask, jsonify
import requests
import os

app = Flask(__name__)

DISCORD_BOT_TOKEN = os.environ.get("MTUxMTQ3ODQzNzE1NDUyNTE4NA.GorjVo.z6y6HqYZV7oMMBJYXEYGuj82uLJqIW25gMLbbc")
GUILD_ID = "1492690243906703511"


@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "message": "Twitter and Discord API is running"
    })


@app.route("/api/twitter/<username>")
def twitter(username):
    username = username.lstrip("@")

    url = f"https://api.fxtwitter.com/user/{username}/tweets"

    try:
        response = requests.get(url, timeout=15)

        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": "Could not get tweets"
            }), response.status_code

        data = response.json()

        return jsonify(data)

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500


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
        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

        if response.status_code != 200:
            return jsonify({
                "status": "error",
                "message": "Could not get ban list",
                "discord_status": response.status_code
            }), response.status_code

        data = response.json()

        if not data:
            formatted = (
                "🔨 **CURRENT BANNED USERS:** `0`\n\n"
                "No banned users."
            )

        else:
            lines = [
                f"🔨 **CURRENT BANNED USERS:** `{len(data)}`",
                ""
            ]

            for ban in data:
                user = ban.get("user", {})

                username = user.get(
                    "username",
                    "Unknown"
                )

                user_id = user.get(
                    "id",
                    "Unknown"
                )

                # Actual Discord mention
                lines.append(
                    f"<@{user_id}> — `{username}`"
                )

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


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000
    )
