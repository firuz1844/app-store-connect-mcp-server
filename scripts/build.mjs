import { rmSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
rmSync(new URL('../dist/', import.meta.url), { recursive: true, force: true });
const result = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc'], { stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
chmodSync(new URL('../dist/src/index.js', import.meta.url), 0o755);
