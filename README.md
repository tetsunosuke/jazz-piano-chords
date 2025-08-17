# Jazz Piano Chords

ジャズピアノのコードボイシングを視覚的に学習できるWebアプリケーション

![Jazz Piano Chords](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)
![CSS3](https://img.shields.io/badge/CSS3-Responsive-blue.svg)
![HTML5](https://img.shields.io/badge/HTML5-Semantic-orange.svg)

## ✨ 特徴

- 🎹 **実践的なボイシング**: ジャズピアノで使われる実際のコードボイシング（ルート音省略＋テンション追加）
- 📝 **複数コード対応**: カンマ区切りや改行で複数のコードを同時表示
- 🎵 **動的コード生成**: 音楽理論に基づいた正確な構成音の自動算出
- 📱 **レスポンシブ**: デスクトップ・モバイル両対応
- ⚡ **リアルタイム**: 入力と同時にリアルタイム表示

## 🚀 デモ

コード入力例：
```
CM7, Dm7, G7
FM7, Bb7, EbM7
Am7, D7, GM7
```

各コードがピアノ鍵盤上でハイライト表示され、改行ごとに行が分かれて配置されます。

## 🎯 対応コード

- **メジャー7th**: CM7, FM7, BbM7...
- **マイナー7th**: Dm7, Am7, Em7...  
- **ドミナント7th**: G7, D7, A7...
- **ハーフディミニッシュ**: Bm7b5, F#m7b5...
- **トライアド**: C, Dm, F... (自動的に7thコードとして解釈)

## 🛠 技術スタック

- **HTML5**: セマンティックマークアップ
- **CSS3**: Flexbox、レスポンシブデザイン
- **JavaScript (ES6+)**: モジュール設計、音楽理論計算

## 📦 ファイル構成

```
jazz-piano-chords/
├── index.html          # メインページ
├── style.css           # スタイルシート  
├── script.js           # アプリケーションロジック
├── CLAUDE.md          # 技術仕様書
└── README.md          # プロジェクト概要（本ファイル）
```

## 🔧 ローカル実行

1. リポジトリをクローン
```bash
git clone https://github.com/tetsunosuke/jazz-piano-chords.git
cd jazz-piano-chords
```

2. Live Serverで実行
```bash
# VS Codeの場合
# Live Server拡張機能をインストール後、index.htmlで右クリック → "Open with Live Server"

# または Python簡易サーバー
python -m http.server 8000
```

3. ブラウザでアクセス
```
http://localhost:8000
```

## 📚 音楽理論背景

### ジャズピアノのボイシング特徴

1. **ルート音省略**: ベースが担当するため、ピアノはルート音を弾かない
2. **テンション追加**: 9th、11th、13thなどのテンションを加える
3. **適切な音域**: 中音域（C2-D3程度）でのコンパクトなボイシング

### 例：CM7の変換
- **理論上**: C-E-G-B
- **実践的**: E-G-B-D（ルート省略＋9thテンション追加）

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成（`git checkout -b feature/amazing-feature`）
3. 変更をコミット（`git commit -m 'Add amazing feature'`）
4. ブランチにプッシュ（`git push origin feature/amazing-feature`）
5. プルリクエストを開く

## 📄 ライセンス

このプロジェクトはMITライセンスです。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 👨‍💻 作者

**tetsunosuke**
- GitHub: [@tetsunosuke](https://github.com/tetsunosuke)

## 🙏 謝辞

ジャズピアノ理論の参考資料と、Webオーディオ技術に感謝します。