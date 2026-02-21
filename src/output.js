import Table from 'cli-table3';
import chalk from 'chalk';

export function printTable(headers, rows) {
  const table = new Table({
    head: headers.map((h) => chalk.cyan(h)),
    style: { compact: false },
  });
  rows.forEach((row) => table.push(row));
  console.log(table.toString());
}

export function printJSON(data) {
  console.log(JSON.stringify(data, null, 2));
}

export function printCount(count, total) {
  console.log(chalk.dim(`Showing ${count} of ${total} total`));
}
