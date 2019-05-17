SunabaWeb
======

SunabaWebだけをTypeScriptで開発しました。

* オリジナル
https://github.com/hirasho/Sunaba

* プログラムはこうして作られるプログラマの頭の中をのぞいてみよう-平山尚
https://www.amazon.co.jp/dp/479803925X


## ターミナルの操作方法

### git clone直後

```
npm install
```

### ビルド
webpackを使って、dist/main.jsにビルドします

```
npm run-script build
```

### eslint

eslintを使います。
```
npm run-script lint
```

### テスト

```
npm run-script test
```

まとめて実行
```
npm run-script build; npm run-script test; npm run-script lint
```

## 実行

dist/main.js も gitに入れてあります。
ビルドしなくても、試せます。

### 初期サンプル

* PCのChromeやFireFoxで、./SunabaWeb/index.htmlを開いてください。
* [実行]ボタンをクリックしてください。
* 画面中央に小さい白い■が表示されるはずです。

### 13章/12_完成.txt（テトリス風ゲーム）

* ./samples/サンプル/13章/12_完成.txtをテキストエディターで開いてください。
* 内容をコピーして、画面中央のテキストエリアにペーストしてください。
* [実行]ボタンをクリックしてください。
* ブロックの固まりが落ちてきます。
* 上キーで回転します。
* 左右キーで左右に移動します。


### リバーシサンプル

* ./samples/サンプル/リバーシサンプル.txtをテキストエディターで開いてください。
* 内容をコピーして、画面中央のテキストエリアにペーストしてください。
* [実行]ボタンをクリックしてください。
* しらばくすると、緑のマス目が表示されます。
* マス目を左クリックすると、交互に白黒の□■が置かれていきます。

### 三目並べ

* ./samples/サンプル/リバーシお手本.txtをテキストエディターで開いてください。
* 内容をコピーして、画面中央のテキストエリアにペーストしてください。
* [実行]ボタンをクリックしてください。
* しらばくすると、緑のマス目が表示されます。
* マス目を左クリックすると、交互に白黒の○●が置かれていきます。