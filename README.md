SunabaWeb
======

SunabaWebをTypeScriptで開発しました。

* github page  
https://ninton.github.io/SunabaWeb/

* 平山氏オリジナル版  
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

* PCのChromeやFireFoxで、./index.htmlを開いてください。
* [実行]ボタンをクリックしてください。
* 画面中央に小さい白い■が表示されるはずです。

### 13章/12_完成.txt（テトリス風ゲーム）

* https://raw.githubusercontent.com/hirasho/Sunaba/master/samples/%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB/13%E7%AB%A0/12_%E5%AE%8C%E6%88%90.txt
* 内容をコピーして、画面中央のテキストエリアにペーストしてください。
* [実行]ボタンをクリックしてください。
* ブロックの固まりが落ちてきます。
* 上キーで回転します。
* 左右キーで左右に移動します。


### リバーシサンプル

* https://raw.githubusercontent.com/hirasho/Sunaba/master/samples/%E3%83%AA%E3%83%90%E3%83%BC%E3%82%B7%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB/%E3%83%AA%E3%83%90%E3%83%BC%E3%82%B7%E3%81%8A%E6%89%8B%E6%9C%AC.txt
* 内容をコピーして、画面中央のテキストエリアにペーストしてください。
* [実行]ボタンをクリックしてください。
* しらばくすると、緑のマス目が表示されます。
* マス目を左クリックすると、交互に白黒の□■が置かれていきます。

### 三目並べ

* https://raw.githubusercontent.com/hirasho/Sunaba/master/samples/%E3%83%AA%E3%83%90%E3%83%BC%E3%82%B7%E3%82%B5%E3%83%B3%E3%83%97%E3%83%AB/%E4%B8%89%E7%9B%AE%E4%B8%A6%E3%81%B9%E3%81%8A%E6%89%8B%E6%9C%AC.txt
* 内容をコピーして、画面中央のテキストエリアにペーストしてください。
* [実行]ボタンをクリックしてください。
* しらばくすると、緑のマス目が表示されます。
* マス目を左クリックすると、交互に白黒の○●が置かれていきます。
