import client from '../client.js';

export async function listConsoles() {
  const res = await client.get('/v1/hosts');
  return res.data.data ?? [];
}

export async function resolveConsoleId(consoleId) {
  if (consoleId) return consoleId;
  const consoles = await listConsoles();
  if (consoles.length === 0) {
    console.error('Error: No consoles found for this API key.');
    process.exit(1);
  }
  if (consoles.length > 1) {
    console.error('Multiple consoles found. Set UNIFI_CONSOLE_ID in .env to one of:');
    consoles.forEach((c) => console.error(`  ${c.id}  (${c.reportedState?.hostname ?? c.id})`));
    process.exit(1);
  }
  return consoles[0].id;
}
