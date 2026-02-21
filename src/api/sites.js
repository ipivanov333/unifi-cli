import client from '../client.js';

export async function listSites() {
  const res = await client.get('/sites');
  return res.data.data ?? [];
}

export async function resolveSiteId(siteId) {
  if (siteId) return siteId;
  const sites = await listSites();
  if (sites.length === 0) {
    console.error('Error: No sites found on this controller.');
    process.exit(1);
  }
  if (sites.length > 1) {
    console.error('Multiple sites found. Set UNIFI_SITE_ID in .env to one of:');
    sites.forEach((s) => console.error(`  ${s.id}  (${s.name})`));
    process.exit(1);
  }
  return sites[0].id;
}
