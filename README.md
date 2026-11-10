# Node.jsの基礎を学ぶハンズオン計画

このハンズオンでは、プロセスとスレッド、JSのビルド、Node.jsだけで作るWeb版TODOを順に学びます。目的は、動いた理由と、ツールやフレームワークが引き受けている仕事を自分の言葉で説明できるようになることです。

## 宿題の意図

課題文から推測すると、3つの宿題は「プログラムの実行」「コードの変換と結合」「Webアプリの処理」を理解するためのものです。出題者の意図そのものを確認した記録ではありません。原文のesbuldはesbuildとして扱います。

| 宿題 | 学ぶこと | 到達目標 |
| --- | --- | --- |
| プロセスとスレッド | 実行単位とメモリの関係 | 識別番号と値の変化から違いを説明する |
| esbuildとRolldownとBabel | ビルドで行われる処理 | 構文の変換とファイルの結合を区別する |
| Node.js単体のTODO | 要求の受信から保存と応答まで | 一件の追加処理を入口から出口まで追う |

TODOの形式は出題者から指定されていません。HTTPを学ぶ題材として、この計画ではブラウザから使うWeb版を提案します。Node.jsの標準機能と、素のHTML・JSを使います。Express、React、データベースは使わず、まず一人で操作する構成を作ります。

## 進め方と準備

学習者が操作し、説明→予想→実行→観察→説明し直す、の順で進めます。一度に案内するのは1課題です。質問への回答や実行結果を受け取ってから次へ進みます。各課題の時間は目安とし、前提でつまずいた場合は、その部分を短い課題に分けます。

必要なのは、macOSのターミナル、エディタ、Node.js、npm、ブラウザです。実施時にNode.jsと各ツールの対応条件を照合します。既存アプリとは別の練習用フォルダを使います。

~~~bash
mkdir nodejs-homework
cd nodejs-homework
node --version
npm --version
~~~

プロセスの実験は標準機能だけで行います。ビルドの課題に入ったら、その場で必要なパッケージを追加します。以下のCUTOFFは実施日から7日前のUTC日時です。dateの-vはmacOS用です。

~~~bash
npm init -y
npm pkg set type=module
CUTOFF="$(date -u -v-7d '+%Y-%m-%dT%H:%M:%SZ')"
npm install --save-dev --before="$CUTOFF" esbuild rolldown @babel/core @babel/cli @babel/preset-env
npm ls --depth=0
~~~

実際に使ったNode.js、npm、パッケージのバージョンと、package-lock.jsonを残します。インストール時にNode.jsの対応条件が合わなければ、実行環境を合わせてから再開します。

実験用スクリプトと生成物は練習用フォルダ内に置きます。サーバーを起動する課題では、この練習用サーバーだけをCtrl+Cで終了します。計算の実験は有限の処理にし、実験後に残るプロセスを作りません。

## プロセスとスレッドを観察する

例えば、同じJSファイルを別々に起動したとき、実行中の変数がどう扱われるかを調べます。プロセスは実行中のプログラムを管理する単位で、通常は別のメモリ空間を持ちます。スレッドは、その中で処理を進める実行単位です。

Node.jsでは、child_process.forkで別のNode.jsプロセスを起動し、Workerで同じプロセス内にJSの実行スレッドを作れます。Workerの普通のJSオブジェクトは自動では共有されず、共有メモリには明示的な仕組みを使います。[子プロセスの公式資料](https://nodejs.org/api/child_process.html#child_processforkmodulepath-args-options)、[Workerの公式資料](https://nodejs.org/api/worker_threads.html)

### 課題1 識別番号を比べる

目安は10分です。問いは「実行元、Worker、子プロセスの共通点と違いは何か」です。同じファイルと実行環境を使い、処理の起動方法を変えます。

後述のexecution.mjsを保存し、実行前にpidが同じになる組み合わせを予想します。実行後はroleごとにpidとthreadIdを並べます。行の表示順は判定に使いません。

完了条件は、番号を根拠にプロセスとスレッドの関係を説明できることです。threadIdはNode.jsがプロセス内で付ける番号です。OS全体で一意の番号として扱いません。

### 課題2 同じプロセスなら値も共有されるか確かめる

目安は10分です。問いは「Workerに渡した普通のJSオブジェクトを変更すると、実行元の値も変わるか」です。

実行元で{ count: 0 }を作り、workerDataとしてWorkerへ渡します。Workerでcountを1増やし、結果をpostMessageで返します。実行元は、結果を受け取った時点で、自分のcountと届いたcountを表示します。

入力と加算処理を固定し、変更を行う場所だけを変えます。観察するのは、実行元の値と返された値です。完了条件は「同じプロセス」と「普通のJS変数の共有」を区別し、メッセージで結果を渡す理由を説明できることです。

### 課題3 待ち時間と計算を区別する

目安は15分です。問いは「asyncを付けるだけで、長い計算中にもほかのJS処理を進められるか」です。

イベントループは、準備のできた処理を順に実行する仕組みです。非同期の入出力は、結果を待つ間に別の処理を進めるために使います。長いJS計算は、そのまま実行すると同じスレッドの処理を待たせます。[Node.jsの公式解説](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop)

1. 短い間隔のタイマーを動かし、通知間隔を記録します。

2. 同じスレッドで有限の長い計算を行い、通知間隔を記録します。

3. 計算関数にasyncを付けた場合を試します。

4. 同じ計算をWorkerへ移し、結果をメッセージで受け取ります。

入力、計算内容、タイマー間隔を固定し、計算の実行方法を変えます。計算結果が一致することも確認します。差が小さければ、計算時間が短すぎないか、出力そのものを待たせていないかを見直します。

完了条件は「待ち時間をほかの仕事に使うこと」と「別スレッドで計算を進めること」を区別できることです。この実験からビルドツールの内部実装や速度順位を結論付けません。

## 同じJSを3つのツールでビルドする

ビルドは、ソースコードから実行・配布用のコードを用意する作業です。ここでは、構文を別の書き方へ変える処理と、読み込むファイルをたどってまとめる処理を分けて観察します。

esbuildとRolldownはファイルの結合を担えます。Babelは主に構文の変換を担い、変換ルールを設定して使います。[esbuildの公式資料](https://esbuild.github.io/api/#bundle)、[Rolldownの公式資料](https://rolldown.rs/guide/getting-started)、[Babelの公式資料](https://babeljs.io/docs/usage)

### 課題4 入力と実行結果を固定する

目安は10分です。src/main.jsからsrc/todo.jsをimportする2ファイルを作ります。importは、別ファイルの公開された関数などを読み込む構文です。

src/todo.jsには、TODOのタイトルの前後の空白を取り、タイトルがなければ「無題」を返すformatTodoTitleを用意します。構文変換を観察するため、?.と??を使います。?.は値がnullかundefinedの場合に参照を止め、??はその場合の代わりの値を指定します。

src/main.jsではタイトルありとタイトルなしの2件を処理し、process.stdout.writeで結果を表示します。まずnode src/main.jsで基準の結果を記録します。以後はこの2ファイルと入力を固定します。

完了条件は、読み込まれるファイルと、関数の入出力を説明できることです。

### 課題5 esbuildとRolldownで結合する

目安は15分です。問いは「別ファイルに書いた関数とimportは、出力のどこへ行くか」です。出力形式はES Modulesにそろえます。これはimportとexportを使うJSのモジュール形式です。

~~~bash
./node_modules/.bin/esbuild src/main.js --bundle --format=esm --outfile=dist/esbuild/main.mjs
./node_modules/.bin/rolldown src/main.js --format esm --file dist/rolldown/main.mjs
node dist/esbuild/main.mjs
node dist/rolldown/main.mjs
~~~

入力と実行環境を固定し、ビルドツールを変えます。出力ファイル数、関数の置き場所、importの残り方、実行結果を確認します。完了条件は、両方の出力が基準の結果と一致し、結合された処理を出力コード内で示せることです。

### 課題6 Babelで構文を変換する

目安は15分です。問いは「構文の変換とファイルの結合は、同じ処理か」です。

次のbabel.config.jsonを練習用フォルダ直下へ置きます。targetsは構文の変換先を決める条件です。Chrome 79は構文差を観察するための指定で、この実験で古いブラウザの実動作まで検証するわけではありません。modulesをfalseにしてimportとexportを残します。[設定の公式資料](https://babeljs.io/docs/babel-preset-env)

~~~json
{
  "presets": [
    ["@babel/preset-env", {
      "targets": { "chrome": "79" },
      "modules": false
    }]
  ]
}
~~~

~~~bash
./node_modules/.bin/babel src --out-dir dist/babel
node dist/babel/main.js
~~~

入力と実行環境を固定し、Babelの設定を変えます。比較用に、内容を{"presets": [], "plugins": []}としたbabel.no-transforms.jsonを作ります。次のコマンドで変換ルールを指定しない出力を用意し、?.、??、import、ファイル数を比べます。[設定ファイル指定の公式資料](https://babeljs.io/docs/babel-cli#custom-config-path)

~~~bash
./node_modules/.bin/babel src --no-babelrc --config-file ./babel.no-transforms.json --out-dir dist/babel-unconfigured
node dist/babel-unconfigured/main.js
~~~

完了条件は、実行結果が基準と一致し、変換された構文と残ったファイル間の依存を説明できることです。

3つのツールの評価は、まず役割と出力の違いを対象にします。今回の設定は同一の処理量ではないため、所要時間だけで速度順位を付けません。性能を追加で調べる場合は、機能と入力をそろえ、起動時間を含むかを明記して複数回測ります。

## Node.jsだけでWeb版TODOを作る

ブラウザが要求を送り、Node.jsが受け取り、TODOを変更して結果を返す流れを作ります。HTTPは要求と応答をやり取りする約束です。JSONは、オブジェクトなどの値を文字列としてやり取りする形式です。

通信にはnode:http、ファイル保存にはnode:fs/promisesを使います。HTTP本文は複数の断片として届く場合があるため、読み取りを終えてからJSONとして解釈します。[HTTPの公式資料](https://nodejs.org/api/http.html)、[ファイル操作の公式資料](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options)

### 課題7 要求を受けて応答する

目安は10分です。node:httpのcreateServerを使い、127.0.0.1の3000番ポートでGET /healthへ応答するserver.mjsを作ります。ポートは通信の接続先を区別する番号です。使用中なら別の番号を決め、以後のURLもそろえます。

~~~bash
node server.mjs
~~~

別のターミナルで、練習用サーバーへ送ります。

~~~bash
curl -i http://127.0.0.1:3000/health
~~~

同じサーバーへ既知と未知のパスを送り、状態コードと本文を観察します。既知のパスは200、未知のパスは404を返す仕様にします。完了条件は、要求のmethodとURLをどこで読み、応答をどこで終了するか示せることです。

### 課題8 TODOの一覧と追加を作る

目安は15分です。メモリ上の配列でTODOを管理します。各TODOはid、title、completedを持ちます。idは、表示順が変わっても同じTODOを特定するための値です。

| 要求 | 行うこと | 成功時の状態コード |
| --- | --- | --- |
| GET /todos | 一覧を返す | 200 |
| POST /todos | 追加して作成したTODOを返す | 201 |

本文の読み取りを終えてからJSONを解釈し、空のtitleと壊れたJSONは400で応答します。追加前後で一覧を取得し、件数と内容を比べます。

~~~bash
curl -i http://127.0.0.1:3000/todos
curl -i -X POST http://127.0.0.1:3000/todos -H 'Content-Type: application/json' --data '{"title":"牛乳を買う"}'
curl -i http://127.0.0.1:3000/todos
~~~

入力だけを変え、正常な追加と不正な入力を比べます。完了条件は、POSTの受信から配列の更新、応答までを追え、不正な入力でサーバーが終了しないことです。

### 課題9 完了と削除を作る

目安は15分です。PATCH /todos/:idでcompletedを変更し、DELETE /todos/:idで削除します。:idには実際に作成されたTODOのidを入れます。

更新は200で更新後のTODO、削除は204で本文なし、存在しないidは404を返す仕様にします。更新本文のcompletedは真偽値だけを受け付け、不正なら400を返します。

作成済みの1件を完了にして一覧で確認し、削除してから再び一覧を取得します。同じ操作を存在しないidにも行います。完了条件は、HTTPのmethodとパスを使い分け、成功と失敗を状態コードで見分けられることです。

### 課題10 ブラウザから操作する

目安は15分です。同じNode.jsサーバーからHTMLとブラウザ側のJSを配信し、一覧、入力欄、追加、完了、削除を実装します。ブラウザからの通信にはfetchを使います。

先にcurlで確認したAPIを固定し、操作元をブラウザへ変えます。タイトルはtextContentで表示します。APIの失敗時は画面にエラーを表示します。

ブラウザの開発者ツールで、追加1回の要求と応答を確認します。完了条件は、画面上の操作をmethod、URL、本文、状態コードへ対応付けられることです。

### 課題11 再起動後にデータを読み戻す

目安は15分です。問いは「プロセス内の配列だけで、再起動後もTODOを残せるか」です。まずメモリだけの状態で、追加後に練習用サーバーを終了・再起動し、一覧を確認します。

次に、起動時にdata/todos.jsonを読み、変更後はJSONとして保存する処理を加え、同じ手順で再確認します。実行元のディレクトリが変わっても保存先が変わらないよう、ファイル位置をserver.mjsから決めます。

1プロセスで1件ずつ操作する条件を固定し、保存の有無だけを変えます。複数の保存を同時に走らせません。ファイルが初回に存在しない場合は空の一覧で始め、壊れたJSONは空で上書きせず読み込みエラーとして扱います。ファイル書き込みの同時実行には注意が必要です。[writeFileの公式資料](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options)

完了条件は、同じ操作の再実行で保存の効果を確認し、メモリとファイルの寿命の違いを説明できることです。複数プロセスからの同時更新と、書き込み中の異常終了からの復旧は、このJSON保存方式の学習範囲に含めません。

### 課題12 宿題3つをつなげて説明する

目安は15分です。資料を閉じ、次の内容を自分のコードと出力を根拠に説明します。

- Node.jsのプロセスと、その中のJS実行スレッドの関係。

- 長い計算、非同期の待機、Workerで実行する計算の違い。

- esbuildとRolldownとBabelが、今回の入力に行った処理。

- TODO追加の要求を受けてから、保存して応答するまでの流れ。

- フレームワークを使うなら、自作したどの処理を任せられるか。

次に、一覧取得か追加のどちらかを、資料を見ずにcurlで再現します。説明できなかった点と、再現にヒントが必要だった点を次の短い課題にします。

## 最初に使うコード

課題1で使うexecution.mjsです。Workerと子プロセスは、出力後に終了する構成です。最初にpidの予想を聞き、答えを受け取ってから実行を案内します。

~~~js
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
~~~

~~~bash
node execution.mjs
~~~

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

学習者の実行結果は、まだ確認していません。再開時は課題1のpidの予想から始めます。課題を読んだこと、コードを写して動かしたこと、資料なしで説明・再現できたことを分けて記録します。
