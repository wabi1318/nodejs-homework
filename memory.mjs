// 指定した通知が最初に届くまで待つための機能
import { once } from 'node:events';
// Worker: 別のスレッドを起動する
// isMainThread: 現在のスレッドがメインスレッドかどうかを判断する
// parentPort: 親スレッドとの通信を行うための機能（Workerからmainへメッセージを送るための連絡口）
// workerData: 子スレッドに渡すデータ（起動時にmainからWorkerへ渡されたデータ）
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';

// 渡されたオブジェクトの`count`を1増やし、そのオブジェクトを返す
function incrementCounter(counter) {
  counter.count += 1;
  return counter;
}

if (isMainThread) {
  const mode = process.argv[2] ?? 'worker';
  const original = { count: 0 };
  let result;

  // localなら、その場で変更する
  // originalとresultは同じオブジェクトを参照している
  if (mode === 'local') {
    result = incrementCounter(original);
  // workerなら、別のスレッドで実行する
  } else if (mode === 'worker') {
    const worker = new Worker(new URL(import.meta.url), { workerData: original });
    // Workerからmessageという通知が届くのを待つ
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
