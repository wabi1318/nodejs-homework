# Node.jsだけでWeb版TODOを作る

[教材一覧へ戻る](../README.md)

このパートでは、TODOを追加する操作を、要求の受信、値の検査、配列の変更、保存、応答まで追えるようにします。まずターミナルから動かし、同じ処理をブラウザから呼び出します。

HTTPは、操作を求める「要求」と、その結果を返す「応答」の約束です。要求のmethodは操作の種類、URLのパスは対象を表し、応答の状態コードは結果を表します。JSONは、オブジェクトや配列を文字列でやり取りする形式です。

Node.js標準のnode:httpとnode:fs/promisesを使います。パッケージの追加は不要です。HTTP本文は分かれて届く場合があるため、すべて受け取ってからJSONとして読み取ります。[HTTPの公式資料](https://nodejs.org/api/http.html)、[ファイル操作の公式資料](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options)

作業場所は、このリポジトリ内のtodoフォルダです。課題7の最初に作り、以後は同じファイルを育てます。サーバーの変更時は、起動したターミナルでCtrl+Cを押し、保存後にnode server.mjsで起動し直してください。起動中のサーバーへ送るcurlは、別のターミナルで実行します。

1人で、1件の操作の完了を待ってから次を行う条件で進めます。各課題の予想と実行結果を記録してから、次へ進んでください。目安時間は、コードを保存して試すための時間で、入力や調査にかかる時間によって変わります。

## 課題7 要求を受けて応答する

目安は10分です。ゴールは、要求のmethodとURLを読む場所、応答を終える場所を、自分のコードで示せることです。

**説明**

GET /healthで、サーバーが応答できることを確認する入口を作ります。127.0.0.1は自分のコンピューター、3000は接続先を区別するポート番号です。サーバーは、要求を受け取るたびにrespondToRequestを呼びます。

**予想**

GET /healthとPOST /healthは、同じ結果になると思いますか。methodとURLのどちらを条件にするか、予想を一文で残してください。

**実行**

最初のターミナルで、リポジトリ直下（README.mdのあるフォルダ）から作業場所を用意し、Node.jsのバージョンを記録します。

~~~bash
mkdir -p todo
cd todo
node --version
~~~

[課題7のserver.mjs](../examples/node-todo/task-07/server.mjs)を開き、`todo/server.mjs`へコピーします。以後、server.mjsはこのファイルを指します。

~~~bash
cp ../examples/node-todo/task-07/server.mjs server.mjs
~~~

~~~bash
node server.mjs
~~~

EADDRINUSEが出たら、そのポートは使用中です。PORTを別の番号に変え、このパートのURLも同じ番号にそろえてください。

別のターミナルで、次を1つずつ送ります。curlの-iは、状態コードなどの応答情報も表示する指定です。

~~~bash
curl -i http://127.0.0.1:3000/health
curl -i -X POST http://127.0.0.1:3000/health
curl -i http://127.0.0.1:3000/missing
~~~

**観察**

3つの要求について、状態コードと本文を並べます。JSON.stringifyは値をJSONの文字列に変え、response.endは本文を送って応答を終えます。どの条件に入ったかをコードと対応付けてください。

<details>
<summary>実行後に確認するポイント</summary>

GET /healthは200と{"status":"ok"}を返します。それ以外の2件は404です。パスが同じでも、methodが違えば最初の条件に入りません。

</details>

**説明し直す**

「どの情報を見て応答を決め、どの行で応答を終えたか」を説明してください。資料を閉じ、未知のパスへの要求をもう1回送れたら完了です。

## 課題8 TODOの一覧と追加を作る

目安は15分です。ゴールは、追加要求の本文が配列へ反映され、応答されるまでを追えることです。

**説明**

配列todosに、id、title、completedを持つTODOを入れます。idはTODOを特定する値で、randomUUIDで作ります。GET /todosは一覧、POST /todosは追加に使います。

POSTでは、本文を全部受け取り、JSONを読み取り、titleを検査してから配列を変更します。commitTodosは変更後の配列を反映する関数です。課題11で、この関数にファイル保存を加えます。

**予想**

titleが空白だけの要求、JSONが途中で切れた要求を送ったら、一覧の件数はどうなると思いますか。サーバーが次の要求にも応答できるかも予想してください。

**実行**

サーバーをCtrl+Cで止めます。[課題8のserver.mjs](../examples/node-todo/task-08/server.mjs)を開き、本文の受信と追加処理を確認します。次を`todo/`内で実行して内容全体を置き換え、node server.mjsで起動し直します。

~~~bash
cp ../examples/node-todo/task-08/server.mjs server.mjs
~~~

for awaitは、本文の断片が届くのを待ちながら受け取ります。Buffer.concatで断片をつなぎ、文字列へ戻してからJSON.parseで値として読み取ります。

別のターミナルで、1つずつ実行します。

~~~bash
curl -i http://127.0.0.1:3000/todos
curl -i -X POST http://127.0.0.1:3000/todos -H 'Content-Type: application/json' --data '{"title":" 牛乳を買う "}'
curl -i http://127.0.0.1:3000/todos
curl -i -X POST http://127.0.0.1:3000/todos -H 'Content-Type: application/json' --data '{"title":"   "}'
curl -i -X POST http://127.0.0.1:3000/todos -H 'Content-Type: application/json' --data '{'
curl -i http://127.0.0.1:3000/todos
~~~

**観察**

最初と最後の一覧の件数、成功時に返るidとtitle、不正な入力の状態コードを記録します。固定するのはサーバー、変えるのは要求本文です。

<details>
<summary>実行後に確認するポイント</summary>

初回起動直後の一覧は空です。正常な追加は201、空白だけのtitleと壊れたJSONは400です。不正な2件を送っても一覧は1件のままで、GET /todosに応答します。保存されるtitleの前後の空白は取り除かれます。

</details>

**説明し直す**

本文を受け取る行、検査する行、配列を変える行、201を返す行を順に示してください。JSON.parseが失敗したとき、配列の変更に到達するかも説明できたら完了です。

## 課題9 完了と削除を作る

目安は15分です。ゴールは、同じTODOへの更新と削除を、method、id、状態コードで区別できることです。

**説明**

PATCH /todos/:idはcompletedを変更し、DELETE /todos/:idは削除します。:idは説明用の表記で、実際の要求では一覧にあるidへ置き換えます。更新は200と変更後のTODO、削除は204と本文なし、存在しないidは404にします。

**予想**

1件を削除したあと、同じidでもう1回削除すると、状態コードはどうなると思いますか。completedに文字列の"true"を渡した場合も予想してください。

**実行**

サーバーを止め、HTTP_STATUSのCREATEDの次の行に、次を追加します。

~~~js
  NO_CONTENT: 204,
~~~

respondToRequest内の最後の404を返す行（try内のsendJson(response, HTTP_STATUS.NOT_FOUND, ...）の直前に、次のブロックを追加します。catchの中には入れません。

~~~js
    const todoPath = request.url?.match(/^\/todos\/([^/]+)$/);
    if (todoPath && (request.method === 'PATCH' || request.method === 'DELETE')) {
      const todoId = todoPath[1];
      const todo = todos.find((candidate) => candidate.id === todoId);
      if (!todo) {
        sendJson(response, HTTP_STATUS.NOT_FOUND, { error: 'TODOが見つかりません' });
        return;
      }

      if (request.method === 'PATCH') {
        const body = await readJsonBody(request);
        if (typeof body?.completed !== 'boolean') {
          sendJson(response, HTTP_STATUS.BAD_REQUEST, { error: 'completedはtrueかfalseです' });
          return;
        }
        const updatedTodo = { ...todo, completed: body.completed };
        await commitTodos(todos.map((candidate) => (
          candidate.id === todoId ? updatedTodo : candidate
        )));
        sendJson(response, HTTP_STATUS.OK, updatedTodo);
        return;
      }

      await commitTodos(todos.filter((candidate) => candidate.id !== todoId));
      response.writeHead(HTTP_STATUS.NO_CONTENT);
      response.end();
      return;
    }
~~~

起動し直すと、メモリの一覧は空になります。課題8のPOSTでもう1件作り、応答のidをコピーしてください。次の代入の右側だけ、その値へ置き換えます。続くコマンドの$TODO_IDは、そのまま実行できます。

~~~bash
TODO_ID='ここを作成したTODOのidに置き換える'
curl -i -X PATCH "http://127.0.0.1:3000/todos/$TODO_ID" -H 'Content-Type: application/json' --data '{"completed":true}'
curl -i http://127.0.0.1:3000/todos
curl -i -X PATCH "http://127.0.0.1:3000/todos/$TODO_ID" -H 'Content-Type: application/json' --data '{"completed":"true"}'
curl -i -X DELETE "http://127.0.0.1:3000/todos/$TODO_ID"
curl -i http://127.0.0.1:3000/todos
curl -i -X DELETE "http://127.0.0.1:3000/todos/$TODO_ID"
~~~

**観察**

更新後のcompleted、文字列を渡したときの状態コード、削除応答の本文、2回目の削除の状態コードを記録します。同じidを固定し、操作と本文を変えて比べます。

<details>
<summary>実行後に確認するポイント</summary>

真偽値のtrueでの更新は200、文字列の"true"は400です。最初の削除は204で本文がなく、同じidへの2回目の削除は404です。削除後の一覧は空です。

</details>

**説明し直す**

配列の何番目かではなくidを使う理由と、更新・削除が行う配列の変更を説明してください。作成した別の1件でも、更新→一覧→削除→一覧を再現できたら完了です。

変更後の全体は[課題9のコード](../examples/node-todo/task-09/)と照合できます。

## 課題10 ブラウザから操作する

目安は15分です。ゴールは、画面の1回の操作を、要求のmethod、URL、本文、応答へ対応付けられることです。

**説明**

ここまでのAPI（プログラムから操作を呼び出す入口）を、ブラウザのfetchから呼び出します。同じサーバーでHTMLとJSも配信するため、画面とAPIの接続先がそろいます。

入力したタイトルを文字として表示するため、textContentを使います。要求が失敗したら、画面にエラーを表示します。

**予想**

画面で「追加」を1回押したとき、どのmethodとURLへ、どんな本文が送られると思いますか。

**実行**

サーバーを止め、server.mjsのimportの並びに次を追加します。

~~~js
import { readFile } from 'node:fs/promises';
~~~

respondToRequestのtry {のすぐ後、/healthの条件より前に、次を追加します。配信するのは/と/app.jsの2パスだけです。

~~~js
    if (request.method === 'GET' && (request.url === '/' || request.url === '/app.js')) {
      const isHtml = request.url === '/';
      const fileUrl = new URL(
        isHtml ? './public/index.html' : './public/app.js',
        import.meta.url,
      );
      const content = await readFile(fileUrl);
      response.writeHead(HTTP_STATUS.OK, {
        'Content-Type': isHtml
          ? 'text/html; charset=utf-8'
          : 'text/javascript; charset=utf-8',
      });
      response.end(content);
      return;
    }
~~~

todo内でpublicフォルダを作ります。

~~~bash
mkdir -p public
~~~

[index.html](../examples/node-todo/task-10/public/index.html)を開き、`todo/public/index.html`へコピーします。

~~~bash
cp ../examples/node-todo/task-10/public/index.html public/index.html
~~~

[app.js](../examples/node-todo/task-10/public/app.js)を開き、`todo/public/app.js`へコピーします。

~~~bash
cp ../examples/node-todo/task-10/public/app.js public/app.js
~~~

サーバーを起動し直し、ブラウザでhttp://127.0.0.1:3000を開きます。追加、チェックによる完了、削除を、1つの操作が終わってから次へ進めてください。

**観察**

ブラウザの開発者ツールのNetworkを開き、追加を1回行います。POST /todosの要求本文、201の応答、続くGET /todosを確認します。POSTは変更を依頼し、続くGETは変更後の一覧を画面へ表示するために使います。

タイトルに`<b>牛乳</b>`を入れ、文字として表示されることも確認します。サーバーを起動したターミナルでCtrl+Cを押してから画面で追加し、通信エラーが表示されるか観察してください。その後、node server.mjsで起動し直します。

**説明し直す**

「追加ボタン→fetch→Node.jsの分岐→配列の変更→応答→一覧の描き直し」を、自分のコードを指しながら説明できたら完了です。ブラウザ操作の実施結果は、自分で確認して記録してください。

変更後の全体は[課題10のコード](../examples/node-todo/task-10/)と照合できます。

## 課題11 再起動後にデータを読み戻す

目安は15分です。ゴールは、同じ追加・再起動の操作で、メモリとファイルの寿命の違いを説明できることです。

**説明**

プロセス内の配列と、ファイルに保存したJSONを比べます。条件は、同じTODO、1プロセス、1件ずつの操作にそろえ、保存の有無だけを変えます。

**予想**

今の状態で1件追加し、Ctrl+Cで終了して起動し直すと、一覧はどうなると思いますか。まず予想を書き、保存を追加する前に試してください。

**実行**

1件追加→一覧の確認→Ctrl+C→node server.mjs→一覧の確認を行い、結果を記録します。

その後サーバーを止め、次の3か所を変更します。

1. node:fs/promisesのimport行を、次へ置き換えます。

~~~js
import { mkdir, readFile, writeFile } from 'node:fs/promises';
~~~

2. let todos = [];の1行を、次へ置き換えます。

~~~js
const DATA_DIRECTORY = new URL('./data/', import.meta.url);
const DATA_FILE = new URL('./data/todos.json', import.meta.url);
let todos = await loadTodos();

async function loadTodos() {
  try {
    const savedTodos = JSON.parse(await readFile(DATA_FILE, 'utf8'));
    if (!Array.isArray(savedTodos)) {
      throw new Error('保存ファイルはTODOの配列にしてください');
    }
    return savedTodos;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}
~~~

3. commitTodos関数の全体を、次へ置き換えます。

~~~js
async function commitTodos(nextTodos) {
  await mkdir(DATA_DIRECTORY, { recursive: true });
  await writeFile(DATA_FILE, `${JSON.stringify(nextTodos)}\n`, 'utf8');
  todos = nextTodos;
}
~~~

new URL(..., import.meta.url)で、実行したターミナルの場所に左右されず、server.mjsの隣のdata/todos.jsonへ保存します。ファイルがまだなければ空の一覧で始めます。JSONが壊れていたら起動時にエラーにし、元のファイルを空の配列で上書きしません。

mkdirは保存先を用意し、writeFileは変更後の配列をJSONで保存します。保存が終わってからメモリへ反映し、成功の応答を返します。同じファイルへの保存が重ならないよう、この教材では1件の操作が完了してから次へ進みます。[writeFileの公式資料](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options)

起動し直し、先ほどと同じ「1件追加→一覧→終了→再起動→一覧」を試します。完了状態の変更と削除も、操作後に再起動して確認してください。

**観察**

保存を加える前後で、同じTODOが再起動後にどうなるかを並べます。todo/data/todos.jsonをエディタで開き、一覧と内容を照合します。課題中に起動位置を変えて確かめる場合は、サーバーを止め、リポジトリ直下からnode todo/server.mjsで起動します。

<details>
<summary>実行後に確認するポイントと範囲</summary>

メモリだけの段階では、終了・起動によって配列が作り直されます。ファイル保存を加えた段階では、起動時に保存済みの配列を読み戻します。更新と削除も保存するため、再起動後の一覧へ反映されます。

このJSON保存方式で確認するのは、1プロセスで1件ずつ操作する場合です。複数プロセスの同時更新、保存中の強制終了からの復旧は、この課題の検証範囲に含めません。

</details>

**説明し直す**

「終了して消える値はどこにあり、残る値はどこへ書いたか」「保存に失敗したら成功の応答まで進むか」を説明できたら完了です。学習を終えるときは、起動したターミナルでCtrl+Cを押して練習用サーバーを終了します。保存したコードとdata/todos.jsonは、次回の再開に使えます。

変更後の全体は[課題11のコード](../examples/node-todo/task-11/)と照合できます。

## 課題12 宿題3つをつなげて説明する

目安は15分です。ゴールは、コードを写した状態から、自分で処理をたどり、操作を再現できる状態を確認することです。

**説明と予想**

資料を閉じ、これからどの要求を送ると、どのデータが変わるかを一文で書きます。次に、ここまで作ったコードと自分の実行結果を使い、次を説明します。

- Node.jsのプロセスと、その中のJS実行スレッドの関係。[課題1](01-process-and-thread.md#課題1-識別番号を比べる)のpidとthreadIdを根拠にする。
- 長い計算、非同期の待機、Workerで実行する計算の違い。[課題3](01-process-and-thread.md#課題3-待ち時間と計算を区別する)の観察を根拠にする。
- esbuild、Rolldown、Babelが、今回の入力に行った処理。[課題4〜6](02-build-tools.md)の入力と出力を指す。
- TODO追加の要求を受けてから、本文の読み取り、検査、保存、応答までの流れ。
- フレームワークを使うなら、自作したどの処理を任せたいかと、その理由。

**実行と観察**

サーバーを起動し、一覧取得か追加のどちらかを、資料を見ずにcurlで再現します。要求のmethod、パス、本文、応答の状態コードを、その場で説明してください。

**説明し直す**

説明できなかった点と、再現にヒントが必要だった点を1つ選び、その課題へ戻って短く試し直します。「資料を読んだ」「写して実行できた」「資料なしで説明・再現できた」は、分けて観察の記録へ残してください。

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

[教材一覧へ戻る](../README.md)
