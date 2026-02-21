// Legacy UniFi Controller API — richer data than the Integration API.
// Uses a separate client (different baseURL — no integration/v1 prefix).
import axios from 'axios';
import https from 'https';
import { config } from '../config.js';

const legacyClient = axios.create({
  baseURL: `https://${config.host}`,
  headers: {
    'X-API-Key': config.apiKey,
    'Accept': 'application/json',
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 10000,
});

legacyClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error(`Legacy API error: ${err.response?.status ?? err.code} — ${err.response?.data?.meta?.msg ?? err.message}`);
    process.exit(1);
  }
);

export async function getClientStats() {
  const res = await legacyClient.get(`/proxy/network/api/s/${config.siteName}/stat/sta`);
  return res.data.data ?? [];
}
