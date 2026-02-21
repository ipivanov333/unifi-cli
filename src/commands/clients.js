import { config } from '../config.js';
import { resolveSiteId } from '../api/sites.js';
import { listClients, getClient } from '../api/clients.js';
import { getClientStats } from '../api/legacy.js';
import { printTable, printJSON, printCount } from '../output.js';
import { classify } from '../classify.js';
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
  const map = { ax: 'WiFi 6 (ax)', ac: 'WiFi 5 (ac)', n: 'WiFi 4 (n)', g: 'WiFi 4 (g)', a: '802.11a' };
  return map[proto] ?? proto ?? '—';
}

function radioName(r) {
  if (r === 'na') return '5 GHz';
  if (r === 'ng') return '2.4 GHz';
  if (r === '6e') return '6 GHz';
  return r ?? '—';
}

export function registerClientsCommand(program) {
  const clients = program.command('clients').description('Manage connected clients');

  // ── clients list ─────────────────────────────────────────────────────────
  clients
    .command('list')
    .description('Overview table: name, category, IP, MAC, connection type')
    .option('--type <type>', 'Filter by type: wired, wireless, vpn, teleport')
    .option('--limit <n>', 'Max results (default 200)', '200')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const result = await listClients(siteId, { type: opts.type, limit: parseInt(opts.limit) });

      if (opts.json) { printJSON(result.data); return; }

      printTable(
        ['Name', 'Category', 'Con', 'IP Address', 'MAC Address', 'Connected At'],
        (result.data ?? []).map((c) => [
          c.name ?? '(unnamed)',
          classify(c.name, c.macAddress),
          c.type === 'WIRELESS' ? 'WiFi' : c.type === 'WIRED' ? 'Wired' : c.type ?? '—',
          c.ipAddress ?? '—',
          c.macAddress ?? '—',
          formatDate(c.connectedAt),
        ])
      );
      printCount(result.count, result.totalCount);
    });

  // ── clients stats ─────────────────────────────────────────────────────────
  clients
    .command('stats')
    .description('Full stats for all clients: traffic, signal, rates, uptime')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const all = await getClientStats();
      if (opts.json) { printJSON(all); return; }

      // Sort by tx_bytes descending (heaviest users first)
      all.sort((a, b) => (b.tx_bytes ?? 0) - (a.tx_bytes ?? 0));

      // ── Traffic & packets table ────────────────────────────────────────
      console.log('\n── Traffic & Packets ──────────────────────────────────────────\n');
      printTable(
        ['Name / MAC', 'IP', 'TX', 'RX', 'TX pkts', 'RX pkts', 'TX retries', 'Uptime'],
        all.map((c) => [
          (c.name ?? c.mac) + '\n' + (c.mac ?? ''),
          c.ip ?? c.last_ip ?? '—',
          bytes(c.tx_bytes),
          bytes(c.rx_bytes),
          packets(c.tx_packets),
          packets(c.rx_packets),
          packets(c.tx_retries),
          uptime(c.uptime),
        ])
      );

      // ── Wireless signal & rates table (wireless only) ──────────────────
      const wireless = all.filter((c) => !c.is_wired);
      console.log('\n── Wireless Signal & Rates ────────────────────────────────────\n');
      printTable(
        ['Name / MAC', 'SSID', 'Band', 'Ch', 'Std', 'Signal', 'Noise', 'RSSI', 'TX rate', 'RX rate', 'Satisfaction'],
        wireless.map((c) => [
          (c.name ?? c.mac) + '\n' + (c.mac ?? ''),
          c.essid ?? '—',
          radioName(c.radio),
          c.channel ? `${c.channel} / ${c.channel_width ?? c.channelWidth ?? '?'}MHz` : '—',
          wifiStd(c.radio_proto),
          signal(c.signal),
          signal(c.noise),
          c.rssi != null ? `${c.rssi}` : '—',
          mbps(c.tx_rate),
          mbps(c.rx_rate),
          c.satisfaction != null ? `${c.satisfaction}%` : '—',
        ])
      );

      // ── Device fingerprint table ───────────────────────────────────────
      console.log('\n── Device & Network Info ──────────────────────────────────────\n');
      printTable(
        ['Name / MAC', 'Network', 'VLAN', 'IPv6', 'First Seen', 'Last Seen', 'Roams', 'Idle'],
        all.map((c) => [
          (c.name ?? c.mac) + '\n' + (c.mac ?? ''),
          c.network ?? '—',
          c.gw_vlan != null ? String(c.gw_vlan) : '—',
          (c.ipv6_addresses?.length ? c.ipv6_addresses[0] : '—'),
          formatTs(c.first_seen),
          formatTs(c.last_seen),
          c.roam_count != null ? String(c.roam_count) : '—',
          c.idletime != null ? `${c.idletime}s` : '—',
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

  // ── clients get-stats ──────────────────────────────────────────────────────
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
