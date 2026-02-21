import { config } from '../config.js';
import { resolveSiteId } from '../api/sites.js';
import { listFirewallZones, listFirewallPolicies } from '../api/firewall.js';
import { printTable, printJSON } from '../output.js';

export function registerFirewallCommand(program) {
  const firewall = program.command('firewall').description('View firewall configuration');

  firewall
    .command('zones')
    .description('List firewall zones')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const zones = await listFirewallZones(siteId);

      if (opts.json) {
        printJSON(zones);
        return;
      }

      printTable(
        ['ID', 'Name', 'Type'],
        zones.map((z) => [z.id ?? '—', z.name ?? '—', z.type ?? '—'])
      );
    });

  firewall
    .command('policies')
    .description('List firewall policies')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const policies = await listFirewallPolicies(siteId);

      if (opts.json) {
        printJSON(policies);
        return;
      }

      printTable(
        ['ID', 'Name', 'Action', 'Enabled'],
        policies.map((p) => [
          p.id ?? '—',
          p.name ?? '—',
          p.action ?? '—',
          p.enabled != null ? (p.enabled ? 'yes' : 'no') : '—',
        ])
      );
    });
}
