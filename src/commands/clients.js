import { config } from '../config.js';
import { resolveSiteId } from '../api/sites.js';
import { listClients, getClient } from '../api/clients.js';
import { getClientStats } from '../api/legacy.js';
import { printTable, printJSON, printCount } from '../output.js';
import { classify } from '../classify.js';
import { probeIphone } from '../probe.js';
import { bytes, mbps, uptime, signal, packets } from '../format.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatTs(unix) {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleString();
}

function wifiStd(proto) {
  const map = { ax: 'WiFi 6', ac: 'WiFi 5', n: 'WiFi 4 (n)', g: 'WiFi 4 (g)', a: '802.11a' };
  return map[proto] ?? proto ?? '—';
}

function radioName(r) {
  if (r === 'na') return '5 GHz';
  if (r === 'ng') return '2.4 GHz';
  if (r === '6e') return '6 GHz';
  return r ?? '—';
}

// Returns Good / Fair / Poor based on signal + satisfaction
function healthRating(c) {
  if (c.is_wired) {
    const up = c.uptime ?? 0;
    return up > 300 ? 'Good' : up > 0 ? 'Fair' : 'Poor';
  }
  const sat = c.satisfaction ?? c.satisfaction_now ?? -1;
  const sig = c.signal ?? -100;
  if (sat >= 80 && sig >= -70) return 'Good';
  if (sat >= 50 || sig >= -75) return 'Fair';
  return 'Poor';
}

function name(c) { return c.name ?? c.hostname ?? c.mac; }
function ip(c)   { return c.ip ?? c.last_ip ?? '—'; }

export function registerClientsCommand(program) {
  const clients = program.command('clients').description('Manage connected clients');

  // ── clients list ──────────────────────────────────────────────────────────
  clients
    .command('list')
    .description('Overview: hostname, IP, category, MAC, connection type')
    .option('--type <type>', 'Filter by type: wired, wireless, vpn, teleport')
    .option('--limit <n>', 'Max results (default 200)', '200')
    .option('--probe', 'Probe unclassified wireless clients for iPhone (port 62078)')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const result = await listClients(siteId, { type: opts.type, limit: parseInt(opts.limit) });
      if (opts.json) { printJSON(result.data); return; }

      const clients = result.data ?? [];

      const categoryMap = new Map(clients.map(c => [c.macAddress, classify(c.name, c.macAddress)]));

      if (opts.probe) {
        const unclassifiedWireless = clients.filter(
          c => c.type === 'WIRELESS' && categoryMap.get(c.macAddress) === '?' && c.ipAddress
        );
        if (unclassifiedWireless.length > 0) {
          process.stderr.write(`Probing ${unclassifiedWireless.length} unclassified wireless client(s)...\n`);
          await Promise.all(unclassifiedWireless.map(async (c) => {
            if (await probeIphone(c.ipAddress)) categoryMap.set(c.macAddress, 'Phone');
          }));
        }
      }

      printTable(
        ['Hostname', 'IP Address', 'Category', 'Con', 'MAC Address', 'Connected At'],
        clients.map((c) => [
          c.name ?? '(unnamed)',
          c.ipAddress ?? '—',
          categoryMap.get(c.macAddress),
          c.type === 'WIRELESS' ? 'WiFi' : c.type === 'WIRED' ? 'Wired' : c.type ?? '—',
          c.macAddress ?? '—',
          formatDate(c.connectedAt),
        ])
      );
      printCount(result.count, result.totalCount);
    });

  // ── clients health ────────────────────────────────────────────────────────
  clients
    .command('health')
    .description('Connectivity health: signal, satisfaction, uptime, idle, roams')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const all = await getClientStats();
      if (opts.json) { printJSON(all); return; }

      // Sort: Poor first, then Fair, then Good; within group by satisfaction asc
      const order = { Poor: 0, Fair: 1, Good: 2 };
      all.sort((a, b) => {
        const ra = order[healthRating(a)], rb = order[healthRating(b)];
        if (ra !== rb) return ra - rb;
        return (a.satisfaction ?? 100) - (b.satisfaction ?? 100);
      });

      const wireless = all.filter(c => !c.is_wired);
      const wired    = all.filter(c => c.is_wired);

      console.log('\n── Wireless Health ────────────────────────────────────────────\n');
      printTable(
        ['Hostname', 'IP Address', 'Health', 'Signal', 'Noise', 'Satisfaction', 'RX rate', 'TX rate', 'Uptime', 'Idle', 'Roams', 'AP'],
        wireless.map((c) => [
          name(c),
          ip(c),
          healthRating(c),
          signal(c.signal),
          signal(c.noise),
          c.satisfaction != null ? `${c.satisfaction}%` : '—',
          mbps(c.tx_rate),  // UDM→client = download = RX
          mbps(c.rx_rate),  // client→UDM = upload = TX
          uptime(c.uptime),
          c.idletime != null ? `${c.idletime}s` : '—',
          c.roam_count != null ? String(c.roam_count) : '—',
          c.last_uplink_name ?? '—',
        ])
      );

      console.log('\n── Wired Health ───────────────────────────────────────────────\n');
      printTable(
        ['Hostname', 'IP Address', 'Health', 'Network', 'VLAN', 'Uptime', 'Idle', 'Last Seen'],
        wired.map((c) => [
          name(c),
          ip(c),
          healthRating(c),
          c.network ?? '—',
          c.gw_vlan != null ? String(c.gw_vlan) : '—',
          uptime(c.uptime),
          c.idletime != null ? `${c.idletime}s` : '—',
          formatTs(c.last_seen),
        ])
      );

      const poor = all.filter(c => healthRating(c) === 'Poor').length;
      const fair = all.filter(c => healthRating(c) === 'Fair').length;
      const good = all.filter(c => healthRating(c) === 'Good').length;
      console.log(`\nSummary: ${good} Good  ${fair} Fair  ${poor} Poor  (${all.length} total)`);
    });

  // ── clients stats ─────────────────────────────────────────────────────────
  clients
    .command('stats')
    .description('Full stats: traffic, signal/rates, device info')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const all = await getClientStats();
      if (opts.json) { printJSON(all); return; }

      // Sort by tx_bytes descending — heaviest users first
      all.sort((a, b) => (b.tx_bytes ?? 0) - (a.tx_bytes ?? 0));

      console.log('\n── Traffic & Packets (sorted by RX) ───────────────────────────\n');
      printTable(
        ['Hostname', 'IP Address', 'RX', 'TX', 'RX pkts', 'TX pkts', 'TX retries', 'Uptime'],
        all.map((c) => [
          name(c),
          ip(c),
          bytes(c.tx_bytes),
          bytes(c.rx_bytes),
          packets(c.tx_packets),
          packets(c.rx_packets),
          packets(c.tx_retries),
          uptime(c.uptime),
        ])
      );

      const wireless = all.filter(c => !c.is_wired);
      console.log('\n── Wireless Signal & Rates ────────────────────────────────────\n');
      printTable(
        ['Hostname', 'IP Address', 'SSID', 'Band', 'Ch/Width', 'Std', 'Signal', 'RSSI', 'RX rate', 'TX rate', 'Satisfaction'],
        wireless.map((c) => [
          name(c),
          ip(c),
          c.essid ?? '—',
          radioName(c.radio),
          c.channel ? `${c.channel}/${c.channel_width ?? c.channelWidth ?? '?'}MHz` : '—',
          wifiStd(c.radio_proto),
          signal(c.signal),
          c.rssi != null ? String(c.rssi) : '—',
          mbps(c.tx_rate),
          mbps(c.rx_rate),
          c.satisfaction != null ? `${c.satisfaction}%` : '—',
        ])
      );

      console.log('\n── Device & Network Info ──────────────────────────────────────\n');
      printTable(
        ['Hostname', 'IP Address', 'Network', 'VLAN', 'IPv6', 'First Seen', 'Last Seen', 'Roams'],
        all.map((c) => [
          name(c),
          ip(c),
          c.network ?? '—',
          c.gw_vlan != null ? String(c.gw_vlan) : '—',
          c.ipv6_addresses?.length ? c.ipv6_addresses[0] : '—',
          formatTs(c.first_seen),
          formatTs(c.last_seen),
          c.roam_count != null ? String(c.roam_count) : '—',
        ])
      );

      console.log(`\nTotal clients: ${all.length}`);
    });

  // ── clients get ───────────────────────────────────────────────────────────
  clients
    .command('get <id>')
    .description('Full detail for one client by integration API UUID')
    .option('--json', 'Output raw JSON')
    .action(async (id, opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const data = await getClient(siteId, id);
      if (opts.json) { printJSON(data); return; }
      printTable(
        ['Field', 'Value'],
        Object.entries(data).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')])
      );
    });

  // ── clients get-stats ─────────────────────────────────────────────────────
  clients
    .command('get-stats <mac>')
    .description('All legacy stats for one client by MAC address')
    .option('--json', 'Output raw JSON')
    .action(async (mac, opts) => {
      const all = await getClientStats();
      const c = all.find((x) => x.mac?.toLowerCase() === mac.toLowerCase());
      if (!c) { console.error(`No client found with MAC ${mac}`); process.exit(1); }
      if (opts.json) { printJSON(c); return; }
      printTable(
        ['Field', 'Value'],
        Object.entries(c).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')])
      );
    });
}
