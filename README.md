# Yoridokoro

個人向けのAIマネジメントツールです。目標、タスク、習慣、気づき、心身の状態を一か所で記録し、日次・週次の振り返りにつなげます。Firebase AuthenticationとCloud Firestoreにより、PCとスマートフォンで同じデータを利用できます。

## 起動

```bash
npm install
npm run dev
```

## Firebase設定

1. FirebaseコンソールでWebアプリを追加する
2. Authenticationで「Google」と「メール/パスワード」を有効にする
3. Firestore Databaseを作成する
4. 環境変数を作成してWebアプリの設定値を入力する

```bash
cp .env.example .env.local
```

5. Firebase CLIでセキュリティルールを反映する

```bash
firebase deploy --only firestore:rules
```

6. 開発サーバーを起動する

```bash
npm run dev
```

本番ビルド:

```bash
npm run build
npm run preview
```

## 現在の機能

- 今日のダッシュボード
- タスクの登録・完了・目標との関連付け
- 習慣の登録・日次チェック
- 目標の登録・進捗更新
- 指摘・気づき・改善行動の記録
- 思考・感情・前提・気づき・次の行動を整理する思考ノート
- 思考ノートの行動案からタスクを作成
- 気分、エネルギー、ストレス、睡眠の記録
- 記録に基づく週次レビュー
- Firebase Authentication（Google、メール/パスワード）
- Cloud Firestoreによる端末間リアルタイム同期
- 初回ログイン時のブラウザ内データ移行

Firestoreのデータは `users/{uid}/app/main` に保存され、セキュリティルールで本人だけが読み書きできます。現段階のレビュー生成は端末内のルールベースです。
