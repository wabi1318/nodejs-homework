import { fork } from 'node:child_process';
import { Worker, isMainThread, threadId } from 'node:worker_threads';

const role = !isMainThread
  ? 'worker'
  : process.argv[2] === 'child'
    ? 'child'
    : 'main';

process.stdout.write(
  `${JSON.stringify({ role, pid: process.pid, threadId })}\n`,
);

if (role === 'main') {
  new Worker(new URL(import.meta.url));
  fork(new URL(import.meta.url), ['child']);
}
