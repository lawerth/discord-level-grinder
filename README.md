# 💬 Discord Level Grinder

A multi-token, fully customizable Discord selfbot script to help you level up automatically by sending scheduled messages.

> ⚠️ **For educational purposes only. Misuse may violate Discord’s Terms of Service. Use responsibly.**

---

## 🔧 Features

* ✅ Multi-token support (each token runs as a separate selfbot)
* 📩 Sends random sentences from a separate `sentences.json` file at fixed intervals
* 💬 Supports **special messages** with:

  * Custom message content
  * Scheduled start delay (`startAfter`)
  * Repeat count and interval between repeats
  * Optional target channel per special message
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
      "interval": 60,
      "channelId": "optional_channel_id",
      "perClientDelay": 10
    }
  ]
}
```

### Configuration Options

| Key                                | Type   | Required                    | Description                                              |
| ---------------------------------- | ------ | --------------------------- | -------------------------------------------------------- |
| `tokens`                           | array  | ✅                           | List of user tokens to run the selfbots                  |
| `channels`                         | array  | ✅                           | List of channel IDs for random message sending           |
| `interval`                         | number | ✅                           | Interval in seconds between random messages              |
| `adminID`                          | string | ✅                           | Discord user ID allowed to run commands                  |
| `prefix`                           | string | ✅                           | Command prefix (e.g. `"!"`)                              |
| `specialMessages`                  | array  | ❌                           | Optional list of special scheduled messages              |
| `specialMessages[].content`        | string | ✅ (if specialMessages used) | Message text to send                                     |
| `specialMessages[].startAfter`     | number | ✅ (if specialMessages used) | Delay in seconds before first send                       |
| `specialMessages[].repeat`         | number | ✅ (if specialMessages used) | How many times to send the message                       |
| `specialMessages[].interval`       | number | ✅ (if specialMessages used) | Interval in seconds between each repeat                  |
| `specialMessages[].channelId`      | string | ❌                           | Optional specific channel ID for this special message    |
| `specialMessages[].perClientDelay` | number | ❌                           | Extra delay in seconds per client index to desync starts |

> 📝 Random sentences are loaded from a separate `sentences.json` file in the project root.

---

## 💡 Available Commands

Only the configured admin (via `adminID`) can use these commands by sending messages starting with the defined `prefix`:

| Command   | Description                                                  |
| --------- | ------------------------------------------------------------ |
| `!pause`  | Pause all automated messaging for all tokens                 |
| `!resume` | Resume messaging                                             |
| `!stats`  | Show stats like sent message counts, last used channel, etc. |

---

## 🚨 Disclaimer

This project is **for educational purposes only**. Using selfbots is against Discord’s Terms of Service and may result in account bans. The developer is **not responsible** for misuse.
