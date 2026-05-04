import { spawnSync } from 'child_process';

export function enablePager() {
  if (!process.stdout.isTTY) return;

  const chunks = [];
  const realWrite = process.stdout.write.bind(process.stdout);
  let flushed = false;

  process.stdout.write = (chunk, enc, cb) => {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, typeof enc === 'string' ? enc : 'utf8');
    chunks.push(buf);
    if (typeof cb === 'function') cb();
    return true;
  };

  function flush() {
    if (flushed) return;
    flushed = true;
    process.stdout.write = realWrite;
    const output = Buffer.concat(chunks).toString('utf8');
    if (!output) return;
    // -R: ANSI colors  -F: exit if fits on one screen  -X: don't clear on exit
    spawnSync('less', ['-R', '-F', '-X'], { input: output, stdio: ['pipe', 1, 2] });
  }

  process.on('beforeExit', flush);
  const origExit = process.exit.bind(process);
  process.exit = (code) => { flush(); origExit(code); };
}
