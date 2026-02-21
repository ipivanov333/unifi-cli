import axios from 'axios';
import https from 'https';
import { config } from './config.js';

const client = axios.create({
  baseURL: `https://${config.host}/proxy/network/integration/v1`,
  headers: {
    'X-API-Key': config.apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 10000,
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      console.error(`Error: Cannot reach router at ${config.host}. Are you on the local network?`);
    } else if (err.response?.status === 401) {
      console.error('Error: Invalid API key. Check UNIFI_API_KEY in .env.');
    } else if (err.response?.status === 403) {
      console.error('Error: Access denied. Ensure your API key has sufficient permissions.');
    } else {
      console.error(`Error: ${err.response?.status ?? err.code} — ${err.response?.data?.message ?? err.message}`);
    }
    process.exit(1);
  }
);

export default client;
