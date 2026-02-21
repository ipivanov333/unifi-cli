import client from '../client.js';

export async function listFirewallZones(siteId) {
  const res = await client.get(`/sites/${siteId}/firewall/zones`);
  return res.data.data ?? [];
}

export async function listFirewallPolicies(siteId) {
  const res = await client.get(`/sites/${siteId}/firewall/policies`);
  return res.data.data ?? [];
}
