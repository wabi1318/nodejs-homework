# 同じJSを3つのツールでビルドする

[教材一覧へ戻る](../README.md)

このパートでは、同じ入力をビルドして、構文の書き換えとファイルの結合を区別できるようにします。例えば、2つのファイルで書いた処理を配布するとき、「読み込むファイルをまとめる」と「古い実行環境でも読める書き方へ変える」では、必要な仕事が違います。

ビルドは、ソースコードから実行・配布用のコードを用意する作業です。結合は、別ファイルへの読み込みをたどって処理をまとめることです。構文変換は、処理の意味を保ちながらコードの書き方を変えることです。

esbuildとRolldownには結合と構文変換の機能があります。Babelでは主に構文変換を観察します。今回の設定でそれぞれ何が変わったかを、出力ファイルで確かめます。[esbuildの公式資料](https://esbuild.github.io/api/#bundle)、[Rolldownの公式資料](https://rolldown.rs/guide/getting-started)、[Babelの公式資料](https://babeljs.io/docs/usage)

## このパートの準備

作業場所は`nodejs-homework`直下です。課題4で`src/`を作り、生成物は`dist/`へ出します。課題5以降も入力の2ファイルを変えません。

以下は、Codexが事前検証したバージョンを使う手順です。検証環境はNode.js26.12.1、npm11.20.0です。今回使うBabel8のNode.js対応条件は`^22.18.0 || >=24.11.0`です。学習者のバージョンは、実行時に記録します。

Node.js22なら22.18.0以上、Node.js24以降なら24.11.0以上が今回の対応条件です。手元のバージョンが条件を満たしてから、導入へ進みます。

~~~bash
node --version
npm --version
~~~

`package.json`がなければ、次を一度だけ実行します。

~~~bash
npm init -y
~~~

次に、`.js`で`import`と`export`を使える設定にし、必要なパッケージをこの練習用フォルダへ導入します。`CUTOFF`は実施日から7日前のUTC日時で、`date -v`はmacOS用です。

~~~bash
npm pkg set type=module
CUTOFF="$(date -u -v-7d '+%Y-%m-%dT%H:%M:%SZ')"
npm install --save-dev --before="$CUTOFF" esbuild@0.28.2 rolldown@1.2.16 @babel/core@8.1.0 @babel/cli@8.1.0 @babel/preset-env@8.0.7
npm ls --depth=0
~~~

`package.json`と`package-lock.json`を残します。以後は`./node_modules/.bin/`にある導入済みのコマンドを使います。各ビルドは`dist/`へ結果を書き、同じコマンドを再実行するとその出力を更新します。

## 課題4 入力と実行結果を固定する

目安は10分です。ゴールは、2ファイルの関係と入出力を説明し、後で比較する基準を残すことです。

**説明**

`src/main.js`から、タイトルを整える関数を`src/todo.js`から読み込みます。`export`は関数を別ファイルへ公開する指定、`import`はそれを読み込む指定です。この書き方をES Modulesと呼びます。

`?.`は、値が`null`か`undefined`なら、その先の参照や呼び出しを止めて`undefined`を返します。`??`は、左側が`null`か`undefined`なら右側の値を使います。ここでは、タイトルがない場合のエラーを避けるために使います。

**予想**

次の2件を処理すると、何が何行表示されると思いますか。まず予想を記録してください。

**実行**

~~~bash
mkdir -p src dist
~~~

[src/todo.js](../examples/build-tools/src/todo.js)を開き、`src/todo.js`へコピーします。前後の空白を取り、タイトルが空なら「無題」にします。

~~~bash
cp examples/build-tools/src/todo.js src/todo.js
~~~

[src/main.js](../examples/build-tools/src/main.js)を開き、`src/main.js`へコピーします。

~~~bash
cp examples/build-tools/src/main.js src/main.js
~~~

~~~bash
node src/main.js
node src/main.js > dist/reference.txt
~~~

**観察**

表示は予想と一致しましたか。`main.js`のどこから`todo.js`の関数を呼び、返された文字列をどこで表示しているか、コードを指して確認します。

<details>
<summary>実行後の照合</summary>

Codexの事前検証では、次の2行が出ました。学習者の実行結果も、この内容と照合してください。

~~~text
牛乳を買う
無題
~~~

1件目は前後の空白を取り除きます。2件目は`title`がないため、`?.`と`??`を経て空文字になり、最後の条件で「無題」を返します。

</details>

**説明し直す**

資料を閉じ、「`main.js`が読み込むファイル」「関数に渡す値」「関数から返る値」を説明してください。`dist/reference.txt`に基準の2行が保存できたら完了です。

## 課題5 esbuildとRolldownで結合する

目安は15分です。ゴールは、結合後に別ファイルの処理がどこへ移ったかを示し、実行結果が変わっていないか判定することです。

**説明**

ビルドの入口を`src/main.js`にします。ツールはそこから読み込まれるファイルをたどります。入力コードと実行環境を固定し、使うツールだけを変えます。出力形式は両方ともES Modulesにそろえます。

**予想**

各ツールの出力に、`import './todo.js'`に相当する読み込みと`formatTodoTitle`の処理は、それぞれどのように残ると思いますか。出力されるJSファイル数も予想してください。

**実行**

~~~bash
./node_modules/.bin/esbuild src/main.js --bundle --format=esm --outfile=dist/esbuild/main.mjs
./node_modules/.bin/rolldown src/main.js --format esm --file dist/rolldown/main.mjs
node dist/esbuild/main.mjs
node dist/rolldown/main.mjs
~~~

esbuildの`--bundle`は結合の指定です。Rolldownはこのコマンドで結合します。`--format`は出力形式、`--outfile`と`--file`は出力先を指定します。`.mjs`はNode.jsがES Modulesとして扱う拡張子です。

実行結果を保存し、課題4の基準と照合します。

~~~bash
node dist/esbuild/main.mjs > dist/esbuild/result.txt
node dist/rolldown/main.mjs > dist/rolldown/result.txt
diff -u dist/reference.txt dist/esbuild/result.txt
diff -u dist/reference.txt dist/rolldown/result.txt
~~~

`diff`は、2つのファイルの内容に違いがあれば表示します。何も表示せず終了すれば一致しています。

**観察**

`dist/esbuild/main.mjs`と`dist/rolldown/main.mjs`をエディタで開き、次の点を比べます。`result.txt`は実行結果の控えなので、JSファイル数には含めません。

- それぞれ何個のJSファイルができたか。
- `formatTodoTitle`の処理がどこにあるか。名前が変わっていれば、`trim`や「無題」を手掛かりに探す。
- `./todo.js`を読み込む`import`が残っているか。
- `?.`と`??`が残っているか。
- 両方の実行結果が`dist/reference.txt`と一致したか。

<details>
<summary>実行後に確かめること</summary>

事前検証では、どちらも1個の`.mjs`に2ファイルの処理が入り、`./todo.js`への`import`は残りませんでした。両方とも`?.`と`??`は残り、実行結果は課題4と一致しました。

ES Modules形式を指定しても、結合で不要になったファイル間の`import`まで残すわけではありません。また、今回のコマンドでは古い実行環境への変換条件を指定していません。構文が残ったことから、ツールに構文変換機能がないと判断しないでください。

</details>

**説明し直す**

出力コードを指しながら、「2ファイルの処理がどうまとまったか」と「出力形式とファイル数は別の指定である理由」を説明してください。基準との一致を確認できたら完了です。

## 課題6 Babelで構文を変換する

目安は15分です。ゴールは、構文変換と結合を区別し、変換ルールが出力へ与える影響を示すことです。

**説明**

Babelは変換ルールを指定して使います。`@babel/preset-env`は、対象の実行環境に合わせた変換ルールの組です。`targets`で変換先の条件、`modules: false`で`import`と`export`をそのまま残す指定をします。[preset-envの公式資料](https://babeljs.io/docs/babel-preset-env#modules)

Chrome 79は構文の差を観察するための条件です。生成したコードの実行確認には、引き続き手元のNode.jsを使います。

**予想**

変換ルールを指定した場合と指定しない場合で、`?.`、`??`、`import`、JSファイル数は、それぞれどう変わると思いますか。入力の2ファイルは課題4から変えません。

**実行**

`nodejs-homework`直下に`babel.config.json`を保存します。

設定は[babel.config.json](../examples/build-tools/babel.config.json)で確認できます。

~~~bash
cp examples/build-tools/babel.config.json babel.config.json
~~~

~~~bash
./node_modules/.bin/babel src --out-dir dist/babel
node dist/babel/main.js
node dist/babel/main.js > dist/babel/result.txt
diff -u dist/reference.txt dist/babel/result.txt
~~~

続いて、変換ルールを指定しない比較用の`babel.no-transforms.json`を同じ場所へ保存します。

設定は[babel.no-transforms.json](../examples/build-tools/babel.no-transforms.json)で確認できます。

~~~bash
cp examples/build-tools/babel.no-transforms.json babel.no-transforms.json
~~~

~~~bash
./node_modules/.bin/babel src --no-babelrc --config-file ./babel.no-transforms.json --out-dir dist/babel-unconfigured
node dist/babel-unconfigured/main.js
node dist/babel-unconfigured/main.js > dist/babel-unconfigured/result.txt
diff -u dist/reference.txt dist/babel-unconfigured/result.txt
~~~

`--config-file`で比較用の設定ファイルを明示し、`--no-babelrc`で別の`.babelrc`設定の読み込みを止めます。[設定ファイル指定の公式資料](https://babeljs.io/docs/babel-cli#using-config-files)

**観察**

`dist/babel/`と`dist/babel-unconfigured/`の`main.js`と`todo.js`を開き、変換ルールの有無で次の点を比べます。`result.txt`はJSファイル数に含めません。

- `todo.js`の`?.`と`??`が、どのようなコードになったか。
- `main.js`の`import`と、`todo.js`の`export`が残っているか。
- JSファイルは何個あるか。
- 両方の実行結果が課題4の基準と一致したか。

<details>
<summary>実行後の照合と、この比較から分かること</summary>

事前検証では、Chrome 79を指定した`todo.js`から`?.`と`??`がなくなり、値が`null`や`undefined`かを調べる式へ変わりました。変換ルールを指定しない`todo.js`には、両方の構文が残りました。

どちらも`main.js`と`todo.js`の2ファイルができ、`import`と`export`が残りました。表示結果は課題4と一致しました。今回のBabelの使い方では、構文を変えてもファイル間の読み込みは残っています。

Chrome 79で実際に動かす検証はしていません。ここで照合したのは、出力コードの差と、手元のNode.jsで実行した結果です。

</details>

**説明し直す**

資料を閉じ、次の3点を自分の出力を根拠に説明してください。

- esbuildとRolldownが、今回の2ファイルをどうまとめたか。
- Babelで何を指定すると、どの構文が変わったか。
- 「構文が変わった」と「1ファイルになった」を、別々に確認する理由。

すべての実行結果が基準と一致し、構文の変換と結合を出力コードで区別できたら完了です。この比較では各ツールに同じ処理量を指定していないため、ビルド時間から速度順位を付けません。

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

[次へ：Node.jsだけでWeb版TODOを作る](03-node-todo.md)
