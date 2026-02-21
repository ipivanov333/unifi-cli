import { createRequire } from 'module';
import { resolve } from 'path';
import { homedir } from 'os';
import { existsSync } from 'fs';

const require = createRequire(import.meta.url);
const dotenv = require('dotenv');

// Primary config: ~/.config/unifi-cli/config (chmod 600, never in repo)
const systemConfig = resolve(homedir(), '.config', 'unifi-cli', 'config');

if (!existsSync(systemConfig)) {
  console.error(
    `Error: Config file not found at ${systemConfig}\n` +
    `Create it with:\n` +
    `  mkdir -p ~/.config/unifi-cli && chmod 700 ~/.config/unifi-cli\n` +
    `  cp .env.example ~/.config/unifi-cli/config\n` +
    `  chmod 600 ~/.config/unifi-cli/config\n` +
    `Then fill in your values.`
  );
  process.exit(1);
}

dotenv.config({ path: systemConfig });

const { UNIFI_HOST, UNIFI_API_KEY, UNIFI_SITE_ID, UNIFI_SITE_NAME } = process.env;

if (!UNIFI_HOST) {
  console.error(`Error: UNIFI_HOST is not set in ${systemConfig}`);
  process.exit(1);
}

if (!UNIFI_API_KEY) {
  console.error(`Error: UNIFI_API_KEY is not set in ${systemConfig}`);
  process.exit(1);
}

export const config = {
  host: UNIFI_HOST,
  apiKey: UNIFI_API_KEY,
  siteId: UNIFI_SITE_ID?.trim() || null,
  siteName: UNIFI_SITE_NAME?.trim() || 'default',
};
