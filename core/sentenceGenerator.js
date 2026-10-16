const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Word Banks ───────────────────────────────────────────────

const subjects = [
    { text: "The squad", isPlural: false },
    { text: "That weird cat", isPlural: false },
    { text: "A random dude", isPlural: false },
    { text: "Hackers", isPlural: true },
    { text: "Aliens", isPlural: true },
    { text: "Ninjas", isPlural: true },
    { text: "The boss", isPlural: false },
    { text: "Some ghost", isPlural: false },
    { text: "Robots", isPlural: true },
    { text: "Zombies", isPlural: true },
    { text: "The admin", isPlural: false },
    { text: "Discord mods", isPlural: true },
    { text: "Noobs", isPlural: true },
    { text: "Pro gamers", isPlural: true },
    { text: "Crypto bros", isPlural: true },
    { text: "The server owner", isPlural: false },
    { text: "The bots", isPlural: true },
    { text: "Developers", isPlural: true },
    { text: "The final boss", isPlural: false },
    { text: "Pigeons", isPlural: true },
    { text: "The mafia", isPlural: false },
    { text: "Cops", isPlural: true },
    { text: "Bounty hunters", isPlural: true },
    { text: "Streamers", isPlural: true },
    { text: "Speedrunners", isPlural: true },
    { text: "The algorithm", isPlural: false },
    { text: "Sysadmins", isPlural: true },
    { text: "The AI", isPlural: false },
    { text: "Trolls", isPlural: true },
    { text: "Spammers", isPlural: true },
    { text: "Lurkers", isPlural: true },
    { text: "Players", isPlural: true },
    { text: "TypeScript nerds", isPlural: true },
    { text: "The database admin", isPlural: false },
    { text: "Cloud servers", isPlural: true },
    { text: "The frontend guy", isPlural: false },
    { text: "Fullstack devs", isPlural: true },
    { text: "A toxic player", isPlural: false },
    { text: "The ban hammer", isPlural: false },
    { text: "A wild glitch", isPlural: false },
    { text: "The security team", isPlural: false },
    { text: "The compiler", isPlural: false },
    { text: "Console logs", isPlural: true },
    { text: "The webhook", isPlural: false },
    { text: "A random script", isPlural: false },
    { text: "The open-source community", isPlural: false },
    { text: "The guild leader", isPlural: false },
    { text: "A phantom user", isPlural: false },
    { text: "The network engineer", isPlural: false },
    { text: "Beta testers", isPlural: true },
    { text: "A mysterious stranger", isPlural: false },
    { text: "The QA team", isPlural: false },
];

const adverbs = [
    "secretly", "quickly", "loudly", "silently", "randomly",
    "awkwardly", "violently", "smoothly", "accidentally", "perfectly",
    "brutally", "casually", "aggressively", "calmly", "blindly",
    "sarcastically", "recklessly", "instantly", "magically", "illegally",
    "desperately", "lazily", "unexpectedly", "stealthily", "proudly",
    "clumsily", "expertly", "nervously", "boldly", "foolishly",
    "flawlessly", "terribly", "infinitely", "recursively", "asynchronously",
    "fatally", "locally", "globally", "remotely",
    "manually", "visually", "securely", "anonymously", "literally",
    "virtually", "digitally", "brightly", "rapidly", "heavily",
];

const verbs = [
    { base: "destroy", past: "destroyed", present: "destroys", presentPlural: "destroy", continuous: "destroying" },
    { base: "hack", past: "hacked", present: "hacks", presentPlural: "hack", continuous: "hacking" },
    { base: "steal", past: "stole", present: "steals", presentPlural: "steal", continuous: "stealing" },
    { base: "fix", past: "fixed", present: "fixes", presentPlural: "fix", continuous: "fixing" },
    { base: "find", past: "found", present: "finds", presentPlural: "find", continuous: "finding" },
    { base: "delete", past: "deleted", present: "deletes", presentPlural: "delete", continuous: "deleting" },
    { base: "upgrade", past: "upgraded", present: "upgrades", presentPlural: "upgrade", continuous: "upgrading" },
    { base: "clone", past: "cloned", present: "clones", presentPlural: "clone", continuous: "cloning" },
    { base: "bypass", past: "bypassed", present: "bypasses", presentPlural: "bypass", continuous: "bypassing" },
    { base: "leak", past: "leaked", present: "leaks", presentPlural: "leak", continuous: "leaking" },
    { base: "crash", past: "crashed", present: "crashes", presentPlural: "crash", continuous: "crashing" },
    { base: "corrupt", past: "corrupted", present: "corrupts", presentPlural: "corrupt", continuous: "corrupting" },
    { base: "spam", past: "spammed", present: "spams", presentPlural: "spam", continuous: "spamming" },
    { base: "banish", past: "banished", present: "banishes", presentPlural: "banish", continuous: "banishing" },
    { base: "summon", past: "summoned", present: "summons", presentPlural: "summon", continuous: "summoning" },
    { base: "roast", past: "roasted", present: "roasts", presentPlural: "roast", continuous: "roasting" },
    { base: "snipe", past: "sniped", present: "snipes", presentPlural: "snipe", continuous: "sniping" },
    { base: "carry", past: "carried", present: "carries", presentPlural: "carry", continuous: "carrying" },
    { base: "ruin", past: "ruined", present: "ruins", presentPlural: "ruin", continuous: "ruining" },
    { base: "expose", past: "exposed", present: "exposes", presentPlural: "expose", continuous: "exposing" },
    { base: "unlock", past: "unlocked", present: "unlocks", presentPlural: "unlock", continuous: "unlocking" },
    { base: "encrypt", past: "encrypted", present: "encrypts", presentPlural: "encrypt", continuous: "encrypting" },
    { base: "reboot", past: "rebooted", present: "reboots", presentPlural: "reboot", continuous: "rebooting" },
    { base: "brick", past: "bricked", present: "bricks", presentPlural: "brick", continuous: "bricking" },
    { base: "ban", past: "banned", present: "bans", presentPlural: "ban", continuous: "banning" },
    { base: "mute", past: "muted", present: "mutes", presentPlural: "mute", continuous: "muting" },
    { base: "ping", past: "pinged", present: "pings", presentPlural: "ping", continuous: "pinging" },
    { base: "compile", past: "compiled", present: "compiles", presentPlural: "compile", continuous: "compiling" },
    { base: "debug", past: "debugged", present: "debugs", presentPlural: "debug", continuous: "debugging" },
    { base: "deploy", past: "deployed", present: "deploys", presentPlural: "deploy", continuous: "deploying" },
    { base: "download", past: "downloaded", present: "downloads", presentPlural: "download", continuous: "downloading" },
    { base: "upload", past: "uploaded", present: "uploads", presentPlural: "upload", continuous: "uploading" },
    { base: "host", past: "hosted", present: "hosts", presentPlural: "host", continuous: "hosting" },
    { base: "merge", past: "merged", present: "merges", presentPlural: "merge", continuous: "merging" },
    { base: "revert", past: "reverted", present: "reverts", presentPlural: "revert", continuous: "reverting" },
    { base: "push", past: "pushed", present: "pushes", presentPlural: "push", continuous: "pushing" },
    { base: "pull", past: "pulled", present: "pulls", presentPlural: "pull", continuous: "pulling" },
    { base: "fetch", past: "fetched", present: "fetches", presentPlural: "fetch", continuous: "fetching" },
    { base: "parse", past: "parsed", present: "parses", presentPlural: "parse", continuous: "parsing" },
    { base: "render", past: "rendered", present: "renders", presentPlural: "render", continuous: "rendering" },
    { base: "spoof", past: "spoofed", present: "spoofs", presentPlural: "spoof", continuous: "spoofing" },
    { base: "unban", past: "unbanned", present: "unbans", presentPlural: "unban", continuous: "unbanning" },
    { base: "block", past: "blocked", present: "blocks", presentPlural: "block", continuous: "blocking" },
    { base: "isolate", past: "isolated", present: "isolates", presentPlural: "isolate", continuous: "isolating" },
    { base: "optimize", past: "optimized", present: "optimizes", presentPlural: "optimize", continuous: "optimizing" },
    { base: "inspect", past: "inspected", present: "inspects", presentPlural: "inspect", continuous: "inspecting" },
    { base: "configure", past: "configured", present: "configures", presentPlural: "configure", continuous: "configuring" },
    { base: "patch", past: "patched", present: "patches", presentPlural: "patch", continuous: "patching" },
    { base: "restore", past: "restored", present: "restores", presentPlural: "restore", continuous: "restoring" },
    { base: "trigger", past: "triggered", present: "triggers", presentPlural: "trigger", continuous: "triggering" },
];

const adjectives = [
    "massive", "creepy", "mysterious", "broken", "shiny",
    "epic", "hilarious", "invisible", "glitchy", "toxic",
    "god-tier", "cursed", "legendary", "savage", "sweaty",
    "overpowered", "useless", "chaotic", "radioactive", "fake",
    "laggy", "scary", "weird", "dank", "sus",
    "rusty", "magical", "brutal", "gigantic", "tiny",
    "async", "deprecated", "nested", "undefined", "null",
    "boolean", "infinite", "local", "global", "untyped",
    "strict", "modular", "open-source", "private", "public",
    "hidden", "encrypted", "dynamic", "static", "raw",
];

const objects = [
    { noun: "server", allowIndefinite: true },
    { noun: "pizza", allowIndefinite: true },
    { noun: "secret code", allowIndefinite: true },
    { noun: "system", allowIndefinite: true },
    { noun: "matrix", allowIndefinite: false },
    { noun: "loot", allowIndefinite: false },
    { noun: "password", allowIndefinite: true },
    { noun: "flying car", allowIndefinite: true },
    { noun: "database", allowIndefinite: true },
    { noun: "firewall", allowIndefinite: true },
    { noun: "mainframe", allowIndefinite: true },
    { noun: "crypto wallet", allowIndefinite: true },
    { noun: "payload", allowIndefinite: true },
    { noun: "source code", allowIndefinite: false },
    { noun: "glitch", allowIndefinite: true },
    { noun: "internet", allowIndefinite: false },
    { noun: "group chat", allowIndefinite: true },
    { noun: "backup", allowIndefinite: true },
    { noun: "API", allowIndefinite: true },
    { noun: "rare item", allowIndefinite: true },
    { noun: "simulation", allowIndefinite: true },
    { noun: "router", allowIndefinite: true },
    { noun: "bug", allowIndefinite: true },
    { noun: "keyboard", allowIndefinite: true },
    { noun: "backdoor", allowIndefinite: true },
    { noun: "algorithm", allowIndefinite: true },
    { noun: "repository", allowIndefinite: true },
    { noun: "script", allowIndefinite: true },
    { noun: "logs", isPlural: true },
    { noun: "stream", allowIndefinite: true },
    { noun: "npm package", allowIndefinite: true },
    { noun: "webhook", allowIndefinite: true },
    { noun: "discord bot", allowIndefinite: true },
    { noun: "promise", allowIndefinite: true },
    { noun: "callback", allowIndefinite: true },
    { noun: "framework", allowIndefinite: true },
    { noun: "interface", allowIndefinite: true },
    { noun: "variable", allowIndefinite: true },
    { noun: "array", allowIndefinite: true },
    { noun: "compiler", allowIndefinite: true },
    { noun: "proxy", allowIndefinite: true },
    { noun: "IP address", allowIndefinite: true },
    { noun: "terminal", allowIndefinite: true },
    { noun: "environment", allowIndefinite: true },
    { noun: "local storage", allowIndefinite: false },
    { noun: "token", allowIndefinite: true },
    { noun: "auth key", allowIndefinite: true },
    { noun: "parameter", allowIndefinite: true },
    { noun: "response", allowIndefinite: true },
    { noun: "endpoint", allowIndefinite: true },
];

// ─── Static Quote Pools ───────────────────────────────────────

const casualQuotes = [
    "anyone down for some games later?",
    "brb grabbing a quick drink",
    "that last round was completely wild",
    "my ping is randomly spiking today",
    "gg wp everyone",
    "back at my desk now",
    "lag is actually crazy right now",
    "almost clutched that one",
    "hope everyone is having a good day",
    "time to grind some more levels",
    "this music playlist is so good honestly",
    "anyone active in chat right now?",
    "finally got some free time to chill",
    "that was such a close match",
    "i need more coffee before continuing",
    "good luck on your drops today everyone",
    "taking a short break, will be back soon",
    "never seen that happen in a game before",
    "keyboard battery is almost dead haha",
    "the vibes are immaculate today",
    "wait what just happened in chat?",
    "definitely need to practice more",
    "ggs to everyone in the lobby",
    "chat is surprisingly quiet today",
    "that strategy actually worked out nicely",
    "farming while listening to lo-fi beats",
    "let us see what happens next round",
    "another successful grind session",
    "cannot believe that just worked",
    "the daily grind never stops honestly",
    "just chilling here for a bit",
    "speedrunning this whole progression",
    "need to upgrade my gear soon",
    "that came out of nowhere honestly",
    "what a crazy day so far",
    "hope the RNG gods bless our drops today",
    "smooth gameplay all day long",
    "heading AFK for a couple minutes",
    "that was super clean not gonna lie",
    "always good to take a short breather",
    "ready for the next match whenever you guys are",
    "just watching the leaderboard climb",
    "today has been super productive",
    "setting up for another long session",
    "leveling up faster than expected",
    "shoutout to everyone in the server",
    "late night gaming hits differently",
    "gotta love when everything goes according to plan",
    "checking the stats one more time",
    "feeling lucky on the next run",
];

const owoQuotes = [
    "hoping for a fabled or mythical drop today",
    "pray luck is on my side for this hunt",
    "time to check the animal inventory again",
    "need more gems before the next battle",
    "lootboxes have been giving decent rewards today",
    "gotta keep the daily streak alive",
    "curse or pray, that is the question",
    "saving up cowoncy for the next big upgrade",
    "these battle stats are looking pretty solid",
    "weapon crate luck has been on point",
    "almost unlocked the next rarity tier",
    "farming gems like there is no tomorrow",
    "that boss fight was super intense",
    "inventory looking clean after that sell run",
    "hope my team setup wins the next battle",
    "another rare animal added to the collection",
    "the cowoncy grind never truly sleeps",
    "ranking up the pet team step by step",
    "gem tier upgrades are totally worth it",
    "waiting on the next hunt cooldown",
    "just sent a cookie to a friend",
    "clover luck activated hopefully",
    "leveling up feels so satisfying in this bot",
    "lootbox RNG please be kind today",
    "traits are finally getting maxed out",
    "gotta make sure my team has top tier weapons",
    "building the ultimate zoo collection",
    "efficiency trait priority is paying off",
    "cannot wait to see the next mythical pet",
    "battling every day to climb the ranks",
    "fabled lootbox opened with great rewards",
    "the pet synergy on this squad is unmatched",
    "daily quests completed with ease",
    "checking team weapons before heading into battle",
    "gem inventory is fully stocked now",
];

const techQuotes = [
    "it works on my machine, so ship it to prod",
    "pushing directly to main because we live dangerously",
    "404: coffee not found, please reboot developer",
    "a git commit a day keeps the bugs away",
    "there are 10 types of people: those who understand binary and those who do not",
    "debugging is like being the detective in a crime movie where you are also the murderer",
    "always test in production for maximum adrenaline",
    "it is not a bug, it is an undocumented feature",
    "refactored the code and somehow fixed three unrelated bugs",
    "merge conflict resolved without any casualties",
    "hardware is the part of the computer you can kick when software crashes",
    "css is easy until you try to center a div",
    "semicolon missing on line 42 changed my whole afternoon",
    "running npm install and praying everything resolves cleanly",
    "my code compiled on the first try, something must be horribly wrong",
    "the server uptime is currently legendary",
    "why write documentation when you can write self-explanatory code",
    "deploying on a Friday afternoon just to feel something",
    "tabs versus spaces debate will never truly end",
    "the database query was so fast it finished yesterday",
    "infinite loops are great until your fan sounds like a jet engine",
    "git rebase interactive is basically time travel with consequences",
    "typescript caught the typo before runtime and saved my whole day",
    "docker container running smooth and lightweight",
    "caching is hard, naming things is harder",
    "there is no cloud, it is just someone else's computer",
    "a clean codebase is the best feeling in the world",
    "the API response time is under ten milliseconds",
    "dark mode is not a preference, it is a lifestyle",
    "restarting the server fixed the issue, do not question it",
    "async await makes everything look so deceptively simple",
    "writing unit tests so my future self does not hate me",
    "stack overflow answered my exact question from 2014",
    "terminal theme looking sleek and modern",
    "garbage collector just saved some memory right on cue",
    "regex is magic and nobody can convince me otherwise",
    "logging everything because console logs are our best friends",
    "continuous integration pipeline passed with flying colors",
    "code review approved without a single comment",
];

const philosophicalQuotes = [
    "The journey of a thousand miles begins with a single step.",
    "Patience is not simply the ability to wait, it is how we behave while waiting.",
    "Small daily improvements over time lead to stunning results.",
    "Simplicity is the ultimate sophistication.",
    "Opportunities multiply as they are seized.",
    "Do what you can, with what you have, where you are.",
    "Action is the foundational key to all success.",
    "Energy flows where attention goes.",
    "Every master was once a beginner.",
    "Consistency is the true foundation of greatness.",
    "Knowledge speaks, but wisdom listens.",
    "Focus on the process, and the results will take care of themselves.",
    "Calm waters never made a skilled sailor.",
    "The secret of getting ahead is getting started.",
    "Great things are done by a series of small things brought together.",
    "Wisdom begins in wonder.",
    "Progress is progress, no matter how small.",
    "Discipline is the bridge between goals and accomplishment.",
    "It always seems impossible until it is done.",
    "Stay curious, stay hungry, stay humble.",
    "Quiet minds produce the clearest thoughts.",
    "What you do every day matters more than what you do once in a while.",
    "Success is the sum of small efforts repeated day in and day out.",
    "The best time to plant a tree was 20 years ago, the second best time is now.",
    "Keep moving forward, one step at a time.",
    "Focus on being productive instead of busy.",
    "Perseverance guarantees that failure is only temporary.",
    "Learn from yesterday, live for today, hope for tomorrow.",
    "The only limit to our realization of tomorrow is our doubts of today.",
    "Quality is not an act, it is a habit.",
];

// ─── Grammar Helpers ──────────────────────────────────────────

const getArticleForWord = (word) => {
    const firstChar = word.trim().toLowerCase()[0];
    return ["a", "e", "i", "o", "u"].includes(firstChar) ? "an" : "a";
};

const formatObjectPhrase = (obj, adj, mode = "random") => {
    if (obj.isPlural) {
        if (mode === "definite" || (mode === "random" && Math.random() < 0.5)) {
            return `the ${adj} ${obj.noun}`;
        }
        return `${adj} ${obj.noun}`;
    }

    const useIndefinite =
        obj.allowIndefinite !== false &&
        (mode === "indefinite" || (mode === "random" && Math.random() < 0.5));

    if (useIndefinite) {
        const article = getArticleForWord(adj);
        return `${article} ${adj} ${obj.noun}`;
    }

    return `the ${adj} ${obj.noun}`;
};

// ─── Sentence Templates (12) ─────────────────────────────────

const sentenceTemplates = [
    // 1. Classic Action
    ({ sub, adv, verb, adj, obj }) =>
        `${sub.text} ${adv} ${verb.past} ${formatObjectPhrase(obj, adj)}.`,

    // 2. Continuous / Current Activity
    ({ sub, adv, verb, adj, obj }) => {
        const be = sub.isPlural ? "are" : "is";
        return `${sub.text} ${be} currently ${adv} ${verb.continuous} ${formatObjectPhrase(obj, adj)}.`;
    },

    // 3. Curious / Did Question
    ({ sub, adv, verb, adj, obj }) =>
        `Did ${sub.text} just ${adv} ${verb.base} ${formatObjectPhrase(obj, adj)}?`,

    // 4. Why Inquiry
    ({ sub, verb, adj, obj }) => {
        const be = sub.isPlural ? "are" : "is";
        return `Why ${be} ${sub.text} ${verb.continuous} ${formatObjectPhrase(obj, adj)} right now?`;
    },

    // 5. Hypothetical Commentary
    ({ sub, adv, verb, adj, obj }) =>
        `Imagine if ${sub.text} ${adv} ${verb.past} ${formatObjectPhrase(obj, adj)}.`,

    // 6. Attempt & Outcome
    ({ sub, verb, adj, obj }) =>
        `${sub.text} tried to ${verb.base} ${formatObjectPhrase(obj, adj)}, but it failed.`,

    // 7. Discovery / Rumor
    ({ sub, adv, verb, adj, obj }) =>
        `I heard that ${sub.text} ${adv} ${verb.past} ${formatObjectPhrase(obj, adj)}.`,

    // 8. Warning / Caution
    ({ sub, adv, verb, adj, obj }) =>
        `Watch out, ${sub.text} might ${adv} ${verb.base} ${formatObjectPhrase(obj, adj)}.`,

    // 9. Status Confirmation
    ({ sub, adv, verb, adj, obj }) =>
        `${sub.text} just confirmed that ${formatObjectPhrase(obj, adj, "definite")} was ${adv} ${verb.past}.`,

    // 10. Habitual Situation
    ({ sub, adv, verb, adj, obj }) => {
        const verbForm = sub.isPlural ? verb.presentPlural : verb.present;
        return `Whenever ${sub.text} ${adv} ${verbForm} ${formatObjectPhrase(obj, adj)}, chaos ensues.`;
    },

    // 11. Recent Accomplishment
    ({ sub, adv, verb, adj, obj }) => {
        const have = sub.isPlural ? "have" : "has";
        return `${sub.text} ${have} ${adv} ${verb.past} ${formatObjectPhrase(obj, adj)} today.`;
    },

    // 12. Cause & Effect
    ({ sub, adv, verb, adj, obj }) =>
        `Nobody expected ${sub.text} to ${adv} ${verb.base} ${formatObjectPhrase(obj, adj)}.`,
];

// ─── Human Touch Post-Processing ─────────────────────────────

const SLANG_SUFFIXES = [
    " lol", " lmao", " gg", " xd", " tbh",
    " ngl", " fr", " fr fr", " haha", " idk",
    " 👀", " 💀", " ✨", " 🔥", " 🚀",
    " 🗿", " :D", " :)",
];

const applyHumanTouch = (sentence) => {
    let result = sentence.trim();
    if (!result) return result;

    const isQuestion = result.endsWith("?");

    // Strip trailing period for punctuation freedom
    if (result.endsWith(".")) {
        result = result.slice(0, -1);
    }

    // 1. Casual Lowercase (~35% chance)
    if (Math.random() < 0.35) {
        result = result[0].toLowerCase() + result.slice(1);
    }

    // 2. Casual Suffix / Emoji (~35% chance)
    if (Math.random() < 0.35) {
        const suffix = pickRandom(SLANG_SUFFIXES);
        if (isQuestion) {
            result = `${result.replace(/\?+$/, "")}${suffix}?`;
        } else {
            result = `${result}${suffix}`;
        }
    } else {
        // Natural punctuation
        if (!isQuestion) {
            const punctRoll = Math.random();
            if (punctRoll < 0.45) {
                result = `${result}.`;
            } else if (punctRoll < 0.55) {
                result = `${result}!`;
            }
            // 45% chance: leave without trailing period (natural Discord chat style)
        }
    }

    return result;
};

// ─── Main Generator ──────────────────────────────────────────

const generateThemedQuote = (theme = "any") => {
    let chosenTheme = theme;
    if (chosenTheme === "any") {
        const roll = Math.random();
        if (roll < 0.35) chosenTheme = "blast";
        else if (roll < 0.60) chosenTheme = "casual";
        else if (roll < 0.80) chosenTheme = "owo";
        else if (roll < 0.90) chosenTheme = "tech";
        else chosenTheme = "philosophical";
    }

    switch (chosenTheme) {
        case "casual":
            return pickRandom(casualQuotes);
        case "owo":
            return pickRandom(owoQuotes);
        case "tech":
            return pickRandom(techQuotes);
        case "philosophical":
            return pickRandom(philosophicalQuotes);
        case "blast":
        default: {
            const sub = pickRandom(subjects);
            const adv = pickRandom(adverbs);
            const verb = pickRandom(verbs);
            const adj = pickRandom(adjectives);
            const obj = pickRandom(objects);
            const template = pickRandom(sentenceTemplates);
            return template({ sub, adv, verb, adj, obj });
        }
    }
};

function generateSentence() {
    const raw = generateThemedQuote("any");
    return applyHumanTouch(raw);
}

module.exports = generateSentence;
