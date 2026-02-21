import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env');

if (existsSync(envPath)) {
  const require = createRequire(import.meta.url);
  const dotenv = require('dotenv');
  dotenv.config({ path: envPath });
}

const { UNIFI_HOST, UNIFI_API_KEY, UNIFI_SITE_ID, UNIFI_SITE_NAME } = process.env;

if (!UNIFI_HOST) {
  console.error('Error: UNIFI_HOST is not set. Add your router IP to .env.');
  process.exit(1);
}

if (!UNIFI_API_KEY) {
  console.error('Error: UNIFI_API_KEY is not set. Generate one in UniFi Network → Settings → Control Plane → Integrations.');
  process.exit(1);
}

export const config = {
  host: UNIFI_HOST,
  apiKey: UNIFI_API_KEY,
  siteId: UNIFI_SITE_ID?.trim() || null,
  siteName: UNIFI_SITE_NAME?.trim() || 'default',
};
