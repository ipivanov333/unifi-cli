import { getClientStats } from '../api/legacy.js';
import { saveSnapshot, loadSnapshot, listSnapshots, buildSummary } from '../snapshots.js';
import { printTable, printJSON } from '../output.js';
import chalk from 'chalk';

function formatTs(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function registerSnapshotsCommand(program) {
  const snap = program.command('snapshots').description('Capture and compare client snapshots');

  // ── snapshots create ──────────────────────────────────────────────────────
  snap
    .command('create')
    .description('Save a snapshot of current client state')
    .option('--label <text>', 'Optional label for this snapshot')
    .option('--json', 'Print saved snapshot as JSON')
    .action(async (opts) => {
      const clients = await getClientStats();
      const { id, path } = saveSnapshot(clients, opts.label);
      if (opts.json) { printJSON(loadSnapshot(id)); return; }
      console.log(`\nSnapshot saved: ${chalk.cyan(id)}`);
      if (opts.label) console.log(`Label: ${opts.label}`);
      console.log(`Clients: ${clients.length}`);
      console.log(`File: ${path}\n`);
    });

  // ── snapshots list ────────────────────────────────────────────────────────
  snap
    .command('list')
    .description('List all saved snapshots')
    .option('--json', 'Output raw JSON')
    .action((opts) => {
      const snaps = listSnapshots();
      if (opts.json) { printJSON(snaps); return; }
      if (snaps.length === 0) {
        console.log('No snapshots yet. Run: node index.js snapshots create');
        return;
      }
      printTable(
        ['ID', 'Timestamp', 'Clients', 'Label'],
        snaps.map(s => [s.id, formatTs(s.timestamp), String(s.total), s.label ?? '—'])
      );
    });

  // ── snapshots show ────────────────────────────────────────────────────────
  snap
    .command('show <id>')
    .description('Show summary of a saved snapshot')
    .option('--json', 'Output raw JSON')
    .action((id, opts) => {
      const s = loadSnapshot(id);
      if (opts.json) { printJSON(s); return; }

      console.log(`\nSnapshot: ${chalk.cyan(s.id)}`);
      console.log(`Taken:    ${formatTs(s.timestamp)}`);
      if (s.label) console.log(`Label:    ${s.label}`);
      console.log(`Clients:  ${s.summary.total}  (${s.summary.byType.wireless} WiFi, ${s.summary.byType.wired} wired)\n`);

      console.log('── By Category ─────────────────────────────────────────────────\n');
      printTable(
        ['Category', 'Count'],
        Object.entries(s.summary.byCategory).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, String(v)])
      );

      console.log('\n── Top 10 by Traffic (TX) ──────────────────────────────────────\n');
      printTable(
        ['Hostname', 'IP', 'TX', 'RX'],
        s.summary.topTraffic.map(c => [c.name, c.ip ?? '—', c.tx, c.rx])
      );
    });

  // ── snapshots compare ─────────────────────────────────────────────────────
  snap
    .command('compare <id>')
    .description('Compare current clients against a saved snapshot')
    .option('--json', 'Output raw JSON')
    .action(async (id, opts) => {
      const [current, snapshot] = await Promise.all([
        getClientStats(),
        Promise.resolve(loadSnapshot(id)),
      ]);

      const curByMac  = new Map(current.map(c  => [c.mac, c]));
      const snapByMac = new Map(snapshot.clients.map(c => [c.mac, c]));

      const appeared   = current.filter(c => !snapByMac.has(c.mac));
      const disappeared = snapshot.clients.filter(c => !curByMac.has(c.mac));

      // Traffic delta for clients present in both
      const both = current.filter(c => snapByMac.has(c.mac)).map(c => {
        const prev = snapByMac.get(c.mac);
        return {
          ...c,
          tx_delta: (c.tx_bytes ?? 0) - (prev.tx_bytes ?? 0),
          rx_delta: (c.rx_bytes ?? 0) - (prev.rx_bytes ?? 0),
        };
      }).filter(c => c.tx_delta > 0 || c.rx_delta > 0)
        .sort((a, b) => b.tx_delta - a.tx_delta);

      if (opts.json) {
        printJSON({ appeared, disappeared, trafficDelta: both });
        return;
      }

      const { bytes: fmtBytes } = await import('../format.js');

      console.log(`\nComparing current state vs snapshot ${chalk.cyan(id)}`);
      console.log(`Snapshot taken: ${formatTs(snapshot.timestamp)}${snapshot.label ? '  (' + snapshot.label + ')' : ''}`);
      console.log(`Current clients: ${current.length}  |  Snapshot clients: ${snapshot.summary.total}\n`);

      // New clients
      if (appeared.length === 0) {
        console.log(chalk.green('✓ No new clients since snapshot'));
      } else {
        console.log(chalk.yellow(`▲ ${appeared.length} new client(s) appeared:\n`));
        printTable(
          ['Hostname', 'IP Address', 'MAC', 'Type'],
          appeared.map(c => [
            c.name ?? c.hostname ?? c.mac,
            c.ip ?? c.last_ip ?? '—',
            c.mac,
            c.is_wired ? 'Wired' : 'WiFi',
          ])
        );
      }

      // Disappeared clients
      console.log();
      if (disappeared.length === 0) {
        console.log(chalk.green('✓ No clients disappeared since snapshot'));
      } else {
        console.log(chalk.yellow(`▼ ${disappeared.length} client(s) disappeared:\n`));
        printTable(
          ['Hostname', 'IP Address', 'MAC', 'Type'],
          disappeared.map(c => [
            c.name ?? c.hostname ?? c.mac,
            c.ip ?? c.last_ip ?? '—',
            c.mac,
            c.is_wired ? 'Wired' : 'WiFi',
          ])
        );
      }

      // Traffic delta
      if (both.length > 0) {
        console.log(`\n── Traffic since snapshot (top 10) ─────────────────────────────\n`);
        printTable(
          ['Hostname', 'IP Address', '+TX', '+RX'],
          both.slice(0, 10).map(c => [
            c.name ?? c.hostname ?? c.mac,
            c.ip ?? c.last_ip ?? '—',
            fmtBytes(c.tx_delta),
            fmtBytes(c.rx_delta),
          ])
        );
      }
    });
}
