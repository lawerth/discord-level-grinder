const subjects = ['The squad', 'That weird cat', 'A random dude', 'Hackers', 'Aliens', 'Ninjas', 'The boss', 'Some ghost', 'Robots', 'Zombies', 'The admin', 'Discord mods', 'Noobs', 'Pro gamers', 'Crypto bros', 'The server owner', 'The bots', 'Developers', 'The final boss', 'Pigeons', 'The mafia', 'Cops', 'Bounty hunters', 'Streamers', 'Speedrunners', 'The algorithms', 'Sysadmins', 'The AI', 'Trolls', 'Spammers', 'Lurkers', 'Gamers', 'TypeScript nerds', 'The database admin', 'Cloud servers', 'The frontend guy', 'Fullstack devs', 'A toxic player', 'The ban hammer', 'A wild glitch', 'The API layer', 'Syntax errors', 'The compiler', 'Console logs', 'JSON files', 'The webhook', 'A random script', 'The npm package', 'The ping', 'The lag spike'];
const adverbs = ['secretly', 'quickly', 'loudly', 'silently', 'randomly', 'awkwardly', 'violently', 'smoothly', 'accidentally', 'perfectly', 'brutally', 'casually', 'aggressively', 'calmly', 'blindly', 'sarcastically', 'recklessly', 'instantly', 'magically', 'illegally', 'desperately', 'lazily', 'unexpectedly', 'stealthily', 'proudly', 'clumsily', 'expertly', 'nervously', 'boldly', 'foolishly', 'flawlessly', 'terribly', 'infinitely', 'recursively', 'asynchronously', 'fatally', 'locally', 'globally', 'remotely', 'automatically', 'manually', 'visually', 'securely', 'anonymously', 'literally', 'virtually', 'digitally', 'blindly', 'rapidly', 'heavily'];
const verbs = ['destroyed', 'hacked', 'stole', 'fixed', 'ate', 'found', 'deleted', 'upgraded', 'cloned', 'bypassed', 'leaked', 'crashed', 'corrupted', 'spammed', 'banished', 'summoned', 'roasted', 'sniped', 'carried', 'ruined', 'exposed', 'unlocked', 'encrypted', 'rebooted', 'bricked', 'smote', 'banned', 'muted', 'cancelled', 'trolled', 'pinged', 'compiled', 'debugged', 'deployed', 'downloaded', 'uploaded', 'hosted', 'merged', 'reverted', 'pushed', 'pulled', 'fetched', 'parsed', 'stringified', 'rendered', 'spoofed', 'unbanned', 'ignored', 'blocked', 'timed out'];
const adjectives = ['massive', 'creepy', 'mysterious', 'broken', 'shiny', 'epic', 'hilarious', 'invisible', 'glitchy', 'toxic', 'god-tier', 'cursed', 'legendary', 'savage', 'sweaty', 'overpowered', 'useless', 'chaotic', 'radioactive', 'fake', 'laggy', 'scary', 'weird', 'dank', 'sus', 'rusty', 'magical', 'brutal', 'gigantic', 'tiny', 'async', 'deprecated', 'nested', 'undefined', 'null', 'boolean', 'infinite', 'local', 'global', 'untyped', 'strict', 'modular', 'open-source', 'private', 'public', 'hidden', 'encrypted', 'dynamic', 'static', 'raw'];
const objects = ['the server', 'the pizza', 'the secret code', 'the system', 'the matrix', 'the loot', 'the password', 'a flying car', 'the database', 'the firewall', 'the mainframe', 'the crypto wallet', 'the payload', 'the source code', 'a glitch', 'the internet', 'the group chat', 'the backup', 'the API', 'a rare item', 'the simulation', 'the router', 'the bug', 'the keyboard', 'the backdoor', 'the algorithm', 'the repository', 'a script', 'the logs', 'the stream', 'the npm package', 'the webhook', 'the discord bot', 'the promise', 'the callback', 'the framework', 'the interface', 'the variable', 'the array', 'the json', 'the compiler', 'the proxy', 'the ip address', 'the terminal', 'the environment', 'the local storage', 'the token', 'the auth key', 'the parameter', 'the response'];

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

function generateSentence() {
  const sub = pickRandom(subjects); 
  const adv = pickRandom(adverbs);  
  const verb = pickRandom(verbs);   
  const adj = pickRandom(adjectives); 
  const obj = pickRandom(objects);  

  const templateType = Math.floor(Math.random() * 5) + 1;

  switch(templateType) {
    case 1:
      return `${sub}.`; 
    case 2:
      return `${sub} ${verb}.`; 
    case 3:
      return `${sub} ${verb} ${obj}.`; 
    case 4:
      return `${sub} ${adv} ${verb} ${obj}.`; 
    default:
      return `${sub} ${adv} ${verb} ${adj} ${obj}.`; 
  }
}

module.exports = generateSentence;
