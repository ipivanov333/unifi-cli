import { config } from '../config.js';
import { resolveSiteId } from '../api/sites.js';
import { listClients, getClient } from '../api/clients.js';
import { printTable, printJSON, printCount } from '../output.js';
import { classify } from '../classify.js';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

export function registerClientsCommand(program) {
  const clients = program.command('clients').description('Manage connected clients');

  clients
    .command('list')
    .description('List connected clients with IP, MAC, and device category')
    .option('--type <type>', 'Filter by type: wired, wireless, vpn, teleport')
    .option('--limit <n>', 'Max results (default 200)', '200')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const result = await listClients(siteId, { type: opts.type, limit: parseInt(opts.limit) });

      if (opts.json) {
        printJSON(result.data);
        return;
      }

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

  clients
    .command('get <id>')
    .description('Get details for a specific client by ID')
    .option('--json', 'Output raw JSON')
    .action(async (id, opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const data = await getClient(siteId, id);

      if (opts.json) {
        printJSON(data);
        return;
      }

      printTable(
        ['Field', 'Value'],
        Object.entries(data).map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')])
      );
    });
}
