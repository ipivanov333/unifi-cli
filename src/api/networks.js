import client from '../client.js';

export async function listNetworks(siteId) {
  const res = await client.get(`/sites/${siteId}/networks`);
  return res.data.data ?? [];
}
