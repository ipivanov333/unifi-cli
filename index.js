#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { registerClientsCommand } from './src/commands/clients.js';
import { registerDevicesCommand } from './src/commands/devices.js';
import { registerFirewallCommand } from './src/commands/firewall.js';
import { registerNetworksCommand } from './src/commands/networks.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pkg = require(resolve(__dirname, 'package.json'));

const program = new Command();

program
  .name('unifi')
  .description('CLI tool for querying your Ubiquiti Dream Machine Pro')
  .version(pkg.version);

registerClientsCommand(program);
registerDevicesCommand(program);
registerFirewallCommand(program);
registerNetworksCommand(program);

program.parse();
