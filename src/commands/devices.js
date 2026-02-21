import { config } from '../config.js';
import { resolveSiteId } from '../api/sites.js';
import { listDevices, getDevice } from '../api/devices.js';
import { printTable, printJSON, printCount } from '../output.js';

export function registerDevicesCommand(program) {
  const devices = program.command('devices').description('Manage UniFi devices');

  devices
    .command('list')
    .description('List all UniFi devices (APs, switches, routers)')
    .option('--limit <n>', 'Max results (default 200)', '200')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const result = await listDevices(siteId, { limit: parseInt(opts.limit) });

      if (opts.json) {
        printJSON(result.data);
        return;
      }

      printTable(
        ['Name', 'Model', 'IP Address', 'MAC Address', 'State'],
        (result.data ?? []).map((d) => [
          d.name ?? '(unnamed)',
          d.model ?? '—',
          d.ipAddress ?? '—',
          d.macAddress ?? '—',
          d.state ?? '—',
        ])
      );
      printCount(result.count, result.totalCount);
    });

  devices
    .command('get <id>')
    .description('Get details for a specific device by ID')
    .option('--json', 'Output raw JSON')
    .action(async (id, opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const data = await getDevice(siteId, id);

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
