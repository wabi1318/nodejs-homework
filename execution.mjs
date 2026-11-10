// 別のnode.jsプロセスを起動する
import { fork } from 'node:child_process';
// Worker: 別のスレッドを起動する
// isMainThread: 現在のスレッドがメインスレッドかどうかを判断する
// threadId: 現在のスレッドのIDを取得する
import { Worker, isMainThread, threadId } from 'node:worker_threads';

const role = !isMainThread
  ? 'worker'
  : process.argv[2] === 'child'
    ? 'child'
    : 'main';

process.stdout.write(
  `${JSON.stringify({ role, pid: process.pid, threadId })}\n`,
);

// mainだけが他の処理を起動する
if (role === 'main') {
  // Worker: 別のスレッドを起動する
  // new URL(import.meta.url): 現在のファイルのURLを取得する
  new Worker(new URL(import.meta.url));
  // fork: 別のnode.jsプロセスを起動する
  // new URL(import.meta.url): 現在のファイルのURLを取得する
  // ['child']: 子プロセスに渡す引数
  fork(new URL(import.meta.url), ['child']);
}
