# 💬 Discord Level Grinder

A multi-token, fully customizable Discord selfbot script to help you level up automatically by sending scheduled messages.

> ⚠️ **For educational purposes only. Misuse may violate Discord’s Terms of Service. Use responsibly.**

---

## 🔧 Features

* ✅ Multi-token support (each token runs as a separate selfbot)
* 📩 Sends random sentences from a separate `sentences.json` file at fixed intervals
* ⏸ Pause/resume functionality via admin commands
* 📊 Token-specific stats (sent message count, last channel used, last message time)
* 🧠 Individual state handling per token
* ⚙️ Rate-limited sending queue per client to avoid hitting Discord limits

---

## 📦 Installation

```bash
git clone https://github.com/lawerth/discord-level-grinder.git
cd discord-level-grinder
npm install
npm start
```

---

## ⚙️ Configuration

1. Create a `tokens.txt` file in the `settings/` directory and add your user tokens (one per line). You can optionally add account names/comments after a `#` character:

```text
token1
token2
token3
```

2. Edit `settings/config.json`:

```json
{
  "channels": [
    "channel_id_1",
    "channel_id_2",
    "channel_id_3"
  ],
  "interval": 60,
  "commands": {
    "enabled": true,
    "prefix": "!",
    "adminID": "your_discord_id"
  }
}
```

### Configuration Options

| Key                  | Type    | Required | Description                                     |
| -------------------- | ------- | -------- | ----------------------------------------------- |
| `channels`           | array   | ✅       | List of channel IDs for random message sending  |
| `interval`           | number  | ✅       | Interval in seconds between random messages     |
| `commands.enabled`   | boolean | ✅       | Enable or disable admin commands                |
| `commands.prefix`    | string  | ✅*      | Command prefix (e.g. `"!"`)                     |
| `commands.adminID`   | string  | ✅*      | Discord user ID allowed to run commands         |

> *\* Required only when `commands.enabled` is `true`.*


> 📝 Random sentences are loaded from a separate `data/sentences.json` file in the project root.

---

## 💡 Available Commands

Only the configured admin (via `adminID`) can use these commands by sending messages starting with the defined `prefix`:

| Command   | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `!pause`  | Pause all automated messaging for all tokens                 |
| `!resume` | Resume messaging                                             |

---

## 🚨 Disclaimer

This project is **for educational purposes only**. Using selfbots is against Discord’s Terms of Service and may result in account bans. The developer is **not responsible** for misuse.
