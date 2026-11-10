import { once } from 'node:events';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { Worker, isMainThread, parentPort } from 'node:worker_threads';

const ITERATION_COUNT = 200_000_000;
const CHECKSUM_MODULUS = 97;
const TIMER_INTERVAL_MS = 100;
const BEFORE_WORK_MS = 300;
const AFTER_WORK_MS = 200;
const WAIT_DURATION_MS = 1_000;

function calculateChecksum() {
  let checksum = 0;
  for (let index = 0; index < ITERATION_COUNT; index += 1) {
    checksum = (checksum + index) % CHECKSUM_MODULUS;
  }
  return checksum;
}

async function calculateChecksumAsync() {
  return calculateChecksum();
}

async function observeTimer(mode) {
  let previousTick = performance.now();
  const timer = setInterval(() => {
    const currentTick = performance.now();
    process.stdout.write(`tick: ${Math.round(currentTick - previousTick)}ms\n`);
    previousTick = currentTick;
  }, TIMER_INTERVAL_MS);

  try {
    await delay(BEFORE_WORK_MS);
    process.stdout.write(`start: ${mode}\n`);
    const startedAt = performance.now();
    let result = null;

    if (mode === 'wait') {
      await delay(WAIT_DURATION_MS);
    } else if (mode === 'sync') {
      result = calculateChecksum();
    } else if (mode === 'async') {
      result = await calculateChecksumAsync();
    } else {
      const worker = new Worker(new URL(import.meta.url));
      [result] = await once(worker, 'message');
    }

    process.stdout.write(
      `${JSON.stringify({ mode, result, elapsedMs: Math.round(performance.now() - startedAt) })}\n`,
    );
    await delay(AFTER_WORK_MS);
  } finally {
    clearInterval(timer);
  }
}

if (isMainThread) {
  const mode = process.argv[2] ?? 'sync';
  if (!['wait', 'sync', 'async', 'worker'].includes(mode)) {
    throw new Error('wait、sync、async、workerのいずれかを指定してください');
  }
  await observeTimer(mode);
} else {
  parentPort.postMessage(calculateChecksum());
}
