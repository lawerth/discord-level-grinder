# 💬 Discord Level Grinder

A multi-token, fully customizable Discord selfbot script to help you level up automatically by sending scheduled messages.

> ⚠️ **For educational purposes only. Misuse may violate Discord’s Terms of Service. Use responsibly.**

---

## 🔧 Features

- ✅ Multi-token support (each token runs as a separate selfbot)
- 📩 Sends random sentences from a file at a fixed interval
- 💬 Supports **special messages** with:
  - Custom message text
  - Scheduled start time
  - Repeat count and interval
- ⏸ Pause/resume functionality via command
- 📊 Token-specific stats (sent messages, last channel, etc.)
- 🧠 Individual state handling per token
- ⏱ Adjustable delay per token to prevent synchronized messages

---

## ⚙️ Configuration

Edit `config.json`:

```json
{
  "tokens": ["your_token_here"],
  "channels": ["channel_id_1", "channel_id_2"],
  "interval": 60,
  "adminID": "your_discord_id",
  "prefix": "!",
  "specialMessages": [
    {
      "content": "Hello!",
      "startAfter": 3600,
      "repeat": 3,
      "interval": 60
    }
  ],
  "specialMessageStartDelayPerClient": 10
}
```

### Options

| Key                             | Type     | Required | Description                                                  |
|----------------------------------|----------|----------|--------------------------------------------------------------|
| `tokens`                        | array    | ✅       | List of user tokens to run selfbots                         |
| `channels`                      | array    | ✅       | List of channel IDs to send messages to                    |
| `interval`                      | number   | ✅       | Interval (in seconds) between each message                 |
| `adminID`                       | string   | ✅       | Your Discord user ID (for command control)                 |
| `prefix`                        | string   | ✅       | Command prefix (e.g., `"!"`)                                |
| `specialMessages`              | array    | ❌       | Optional list of scheduled messages                         |
| `specialMessageStartDelayPerClient` | number | ❌       | Extra delay (in seconds) per token to desync message times |

> 📝 Random messages are loaded from `sentences.json`.

---

## 📦 Installation

```bash
git clone https://github.com/lawerth/discord-level-grinder.git
cd discord-level-grinder
npm install
npm start
```

---

## 💡 Example Commands

Commands are available only to the configured `adminID` and must be sent using the defined `prefix`.

| Command      | Description                     |
|--------------|---------------------------------|
| `!pause`     | Pause automated messaging       |
| `!resume`    | Resume automated messaging      |
| `!stats`     | Show message statistics         |

---

## 🚨 Disclaimer

This project is intended for **educational purposes** only. Automation using selfbots is against Discord’s Terms of Service. The developer is **not responsible** for any misuse.
