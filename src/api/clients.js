import client from '../client.js';

export async function listClients(siteId, { type, limit = 200, offset = 0 } = {}) {
  const params = { limit, offset };
  if (type) params.filter = `type eq "${type.toUpperCase()}"`;
  const res = await client.get(`/sites/${siteId}/clients`, { params });
  return res.data;
}

export async function getClient(siteId, clientId) {
  const res = await client.get(`/sites/${siteId}/clients/${clientId}`);
  return res.data;
}
