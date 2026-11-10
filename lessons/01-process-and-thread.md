# プロセスとスレッドを観察する

[教材一覧へ戻る](../README.md)

このパートでは、処理を別に起動したときの識別番号、変数の値、タイマーの通知を比べます。終わったら「どの処理が同じプロセスに属するか」「値をどう渡すか」「長い計算をどこで行うか」を、出力を根拠に説明できることが目標です。

| 課題 | 比べること | 目安 |
| --- | --- | --- |
| 1 | 実行元・Worker・子プロセスの識別番号 | 10分 |
| 2 | 同じスレッドとWorkerでオブジェクトを変更した結果 | 10分 |
| 3 | 待機・通常の計算・async付きの計算・Workerでの計算中の通知 | 15分 |

コマンドはリポジトリ直下（README.mdのあるフォルダ）で実行します。まず`pwd`で場所、`node --version`でNode.jsのバージョンを確認し、観察の記録へ残してください。このパートは標準機能だけを使い、npmの準備やパッケージ追加は不要です。

~~~bash
pwd
node --version
~~~

実行用コードは[examples/process-and-thread/](../examples/process-and-thread/)にあります。各課題でリポジトリ直下へコピーし、エディタでコードを確認してから実行します。どれも処理が終わると終了し、アプリやデータファイルを作りません。実験を中断するときは、実行しているターミナルでCtrl+Cを押します。

## 課題1 識別番号を比べる

**目的と説明（10分）**

例えば、同じJSファイルを2回起動した場合と、起動したプログラムの中で処理を増やした場合を見分けたいとします。プロセスは、OSが実行中のプログラムを管理する単位です。スレッドは、そのプロセスの中で処理を進める実行単位です。

`pid`はプロセスの識別番号です。`threadId`はNode.jsがプロセス内のJS実行スレッドに付ける番号で、OS全体で一意の番号ではありません。

今回は`node execution.mjs`から始め、`Worker`と`fork`でそれぞれ同じファイルを起動します。ファイルの場所を表す`new URL(import.meta.url)`を渡し、どの役割で起動したかを条件分岐で見分けます。起動方法の仕様は[Workerの公式資料](https://nodejs.org/api/worker_threads.html#class-worker)と[forkの公式資料](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options)で確認できます。

**予想**

実行前に、次の問いへの自分の答えを書いてください。対話で進める場合は、予想を伝えてから実行へ進みます。

- `main`・`worker`・`child`のうち、`pid`が同じになるのはどの組み合わせでしょうか。
- `threadId`が同じ数字だったら、同じプロセスで動いていると判断できるでしょうか。

**実行**

[execution.mjs](../examples/process-and-thread/execution.mjs)を開きます。`process.stdout.write`はターミナルに文字列を出力し、`JSON.stringify`はオブジェクトを文字列に変えます。

~~~bash
cp examples/process-and-thread/execution.mjs execution.mjs
node execution.mjs
~~~

**観察**

3行の出力を、`role`ごとに次の表へ転記してください。行の表示順や、別の実行で同じ`pid`になるかは判定に使いません。

| role | pid（自分の出力） | threadId（自分の出力） |
| --- | --- | --- |
| main | | |
| worker | | |
| child | | |

`pid`が同じ行と異なる行を探し、それぞれの`threadId`を比べます。3行そろわない場合は、表示されたエラーと、保存したファイル名・実行コマンドを確認します。

**説明し直す**

資料を閉じ、「どの2つが同じプロセスか」「`threadId`だけで判定できない理由」を、実際の番号を使って説明してください。

<details>
<summary>観察後に読む：番号の読み方</summary>

`main`と`worker`は同じ`pid`で、`threadId`が異なります。Workerは同じプロセス内に別のJS実行スレッドを作ります。`child`は別のNode.jsプロセスなので、`pid`が異なります。

`main`と`child`の`threadId`はどちらも0になります。それぞれのプロセスの主スレッドなので、同じ数字でも同じプロセスを示しません。Node.js内部で使うスレッドの総数は、この3行では数えていません。

</details>

## 課題2 同じプロセスなら値も共有されるか確かめる

**目的と説明（10分）**

例えば、件数を数えるオブジェクトをWorkerへ渡し、そこで1増やした結果を受け取りたいとします。課題1で同じプロセスだと分かっても、元のオブジェクトがどう変わるかは、別に確かめる必要があります。

`workerData`は起動時にWorkerへデータを渡すための指定です。`parentPort.postMessage`で実行元へ結果を送り、実行元は`once(worker, 'message')`で最初の結果を待ちます。`await`は結果が届くまで、その関数の続きを待つ書き方です。

入力は`{ count: 0 }`、処理は`incrementCounter`のまま固定します。`local`では実行元、`worker`ではWorkerで同じ関数を呼びます。

**予想**

`local`と`worker`のそれぞれで、実行元の`mainCount`と結果の`resultCount`はどうなるでしょうか。4つの値を実行前に書いてください。

**実行**

[memory.mjs](../examples/process-and-thread/memory.mjs)を開きます。

まず実行元だけで変更した結果を確認し、次にWorkerの場合を比べます。

~~~bash
cp examples/process-and-thread/memory.mjs memory.mjs
node memory.mjs local
node memory.mjs worker
~~~

**観察**

`mainCount`は実行元に残っている値、`resultCount`は関数から戻った値かWorkerから届いた値です。予想と出力が違った箇所を1つ挙げてください。

`worker`の場合、実行元は結果の受信後に値を表示しています。「Workerがまだ計算していなかったから」という説明が当てはまるかも、コードで確認します。

**説明し直す**

「同じプロセスにいること」と「同じオブジェクトを直接変更できること」の関係を説明してください。Workerの結果を使うには、コードのどこで受け取ればよいでしょうか。

<details>
<summary>観察後に読む：値の違いと理由</summary>

教材作成時にNode.js v26.12.1で確認した出力です。学習者本人の実行結果とは分けて扱います。

~~~text
{"mode":"local","mainCount":1,"resultCount":1}
{"mode":"worker","mainCount":0,"resultCount":1}
~~~

`local`では同じオブジェクトを変更しています。`workerData`で渡した普通のオブジェクトは複製されるため、Worker側の変更で実行元の`original.count`は変わりません。`postMessage`で返した結果を受け取り、必要な値を実行元で使います。[workerDataの公式資料](https://nodejs.org/api/worker_threads.html#worker_threadsworkerdata)

共有メモリを使うには`SharedArrayBuffer`などの明示的な仕組みが必要です。この課題では普通のオブジェクトの受け渡しを確かめます。

</details>

## 課題3 待ち時間と計算を区別する

**目的と説明（15分）**

例えば、長い集計をしながら、定期的な通知も出したいとします。計算の関数に`async`を付けたときと、Workerで計算したときに、通知がどう変わるかを比べます。

イベントループは、準備のできた処理を順に進める仕組みです。タイマーも指定時間ぴったりに割り込むのではなく、処理を実行できるところで呼び出されます。[Node.jsの公式解説](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

`async`関数はPromiseという、処理の結果を後から受け取れる値を返します。この実験では、計算をそのまま行う関数と、`async`を付けた関数で同じ計算を呼びます。待機には`node:timers/promises`の`setTimeout`を使います。

| モード | 行うこと |
| --- | --- |
| wait | 計算せずに1秒待つ。待ち時間中の通知を確認する |
| sync | 実行元で計算する |
| async | async関数から、実行元で同じ計算をする |
| worker | Workerで同じ計算をする |

`wait`は非同期処理の待ち時間を模した比較用です。計算をする3モードでは、繰り返し回数と計算式を固定します。

**予想**

各モードの`start`から結果表示までに、`tick`は出続けるでしょうか。特に、`async`を付けるとタイマーの通知間隔がどうなるか、理由と一緒に予想してください。

**実行**

[computation.mjs](../examples/process-and-thread/computation.mjs)を開きます。`performance.now()`で時刻の差を取り、`setInterval`で約100ミリ秒ごとに通知しようとします。

4つを1つずつ実行し、前の実行が終了してから次へ進みます。

~~~bash
cp examples/process-and-thread/computation.mjs computation.mjs
node computation.mjs wait
node computation.mjs sync
node computation.mjs async
node computation.mjs worker
~~~

**観察**

見るのは`tick: ...ms`の間隔と、最後の`result`です。`elapsedMs`はモード全体の所要時間で、Workerでは起動と結果受信の時間も含みます。

- `start`と結果表示の間に通知があるか、結果表示の直後に大きな間隔があるかを確認します。
- 計算をする3モードの`result`が一致することを確認します。`wait`の`result`は計算しないため`null`です。
- 通知間隔の差が見えなければ、`ITERATION_COUNT`を増やし、同じ回数で3モードを再実行します。タイマーは正確な100ミリ秒を保証しないため、数ミリ秒の差だけで判断しません。

入力と計算内容を固定し、計算を行う方法だけを変えています。比較中は同じ実験を同時に起動せず、ターミナル出力の量もそろえます。

**説明し直す**

「待ち時間に別の処理を進めること」「計算の関数に`async`を付けること」「Workerで計算すること」の違いを、通知の出方から説明してください。計算をWorkerへ移すとき、結果の受け渡し以外にどんな負担が増えるでしょうか。

<details>
<summary>観察後に読む：通知が待たされる理由</summary>

`wait`では待っている間にも通知を処理できます。`sync`では長い計算が終わるまで同じスレッドのタイマー処理を実行できません。`async`も、この関数内では同じ計算をそのまま実行するため、計算中に通知を処理できません。

`worker`では別のJS実行スレッドで計算し、実行元は通知を処理できます。Workerの起動とメッセージによる受け渡しには時間やメモリが必要なので、短い計算でも得になるかは別に測る必要があります。今回は通知の待たされ方を調べており、ビルドツールの内部実装や速度順位は測っていません。

</details>

**このパートの完了確認**

資料を閉じ、課題1の番号、課題2の値、課題3の通知から、それぞれ何が分かったかを説明します。さらに、`node memory.mjs worker`を資料なしで実行し、出力の2つの値を説明してください。説明できなかった点を観察の記録へ残してから、次のパートへ進みます。

## 観察の記録と再開位置

各課題では、結果の長い貼り付けより、何を比べて何が変わったかを短く残します。

| 記録すること | 記入内容 |
| --- | --- |
| 課題 | 課題番号 |
| 予想 | 実行前に考えたこと |
| 条件 | 実行環境と変更した条件 |
| 観察 | 必要な出力と実際に起きたこと |
| 説明 | その結果になる理由 |
| 再現 | 資料なしでできた操作 |
| 次の一手 | まだ分からないことを確かめる操作 |

課題を読んだこと、コードを動かしたこと、資料なしで説明・再現できたことを分けて記録します。次回は記録した「次の一手」から再開してください。

[次へ：同じJSを3つのツールでビルドする](02-build-tools.md)
