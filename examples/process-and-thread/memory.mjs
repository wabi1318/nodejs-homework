import { once } from 'node:events';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

function incrementCounter(counter) {
  counter.count += 1;
  return counter;
}

if (isMainThread) {
  const mode = process.argv[2] ?? 'worker';
  const original = { count: 0 };
  let result;

  if (mode === 'local') {
    result = incrementCounter(original);
  } else if (mode === 'worker') {
    const worker = new Worker(new URL(import.meta.url), { workerData: original });
    [result] = await once(worker, 'message');
  } else {
    throw new Error('localまたはworkerを指定してください');
  }

  process.stdout.write(
    `${JSON.stringify({ mode, mainCount: original.count, resultCount: result.count })}\n`,
  );
} else {
  parentPort.postMessage(incrementCounter(workerData));
}
