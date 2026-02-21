import { config } from '../config.js';
import { resolveSiteId } from '../api/sites.js';
import { listNetworks } from '../api/networks.js';
import { printTable, printJSON } from '../output.js';

export function registerNetworksCommand(program) {
  const networks = program.command('networks').description('View network/VLAN configuration');

  networks
    .command('list')
    .description('List all networks and VLANs')
    .option('--json', 'Output raw JSON')
    .action(async (opts) => {
      const siteId = await resolveSiteId(config.siteId);
      const nets = await listNetworks(siteId);

      if (opts.json) {
        printJSON(nets);
        return;
      }

      printTable(
        ['Name', 'VLAN ID', 'Subnet', 'Purpose'],
        nets.map((n) => [
          n.name ?? '—',
          n.vlanId ?? '—',
          n.ipSubnet ?? '—',
          n.purpose ?? '—',
        ])
      );
    });
}
