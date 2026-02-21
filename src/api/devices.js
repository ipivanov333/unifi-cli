import client from '../client.js';

export async function listDevices(siteId, { limit = 200, offset = 0 } = {}) {
  const res = await client.get(`/sites/${siteId}/devices`, { params: { limit, offset } });
  return res.data;
}

export async function getDevice(siteId, deviceId) {
  const res = await client.get(`/sites/${siteId}/devices/${deviceId}`);
  return res.data;
}
