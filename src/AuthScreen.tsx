import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { ArrowRight, Cloud, LockKeyhole, Mail, Quote } from "lucide-react";
import { auth } from "./firebase";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const run = async (action: () => Promise<unknown>) => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await action();
    } catch (cause) {
      setError(authErrorMessage(cause));
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const authInstance = auth;
    if (!authInstance) return;
    void run(() =>
      mode === "login"
        ? signInWithEmailAndPassword(authInstance, email, password)
        : createUserWithEmailAndPassword(authInstance, email, password),
    );
  };

  const googleLogin = () => {
    const authInstance = auth;
    if (!authInstance) return;
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    void run(() => signInWithPopup(authInstance, provider));
  };

  const resetPassword = async () => {
    const authInstance = auth;
    if (!authInstance || !email) {
      setError("先にメールアドレスを入力してください。");
      return;
    }
    await run(async () => {
      await sendPasswordResetEmail(authInstance, email);
      setMessage("パスワード再設定メールを送信しました。");
    });
  };

  return (
    <main className="auth-page">
      <section className="auth-story">
        <div className="auth-brand">
          <span className="brand-mark"><Quote size={20} fill="currentColor" /></span>
          <strong>Yoridokoro</strong>
        </div>
        <div>
          <span className="auth-kicker">YOUR PERSONAL COMPASS</span>
          <h1>整えて、<br />自分のペースで前へ。</h1>
          <p>目標も、習慣も、心身の調子も。あなたの毎日を一か所に。</p>
        </div>
        <div className="auth-cloud-note"><Cloud size={18} /><span>Firebaseで安全に同期</span></div>
      </section>

      <section className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <div>
            <span className="label">WELCOME BACK</span>
            <h2>{mode === "login" ? "おかえりなさい" : "アカウントを作成"}</h2>
            <p>{mode === "login" ? "記録の続きを始めましょう。" : "あなた専用の記録場所をつくります。"}</p>
          </div>

          <button type="button" className="google-button" onClick={googleLogin} disabled={loading}>
            <span className="google-mark">G</span> Googleで続ける
          </button>
          <div className="auth-divider"><span>または</span></div>

          <label className="auth-field">
            <span>メールアドレス</span>
            <div><Mail size={17} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
          </label>
          <label className="auth-field">
            <span>パスワード</span>
            <div><LockKeyhole size={17} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6文字以上" minLength={6} required /></div>
          </label>

          {error && <p className="auth-message error">{error}</p>}
          {message && <p className="auth-message success">{message}</p>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "接続中…" : mode === "login" ? "ログイン" : "登録する"} <ArrowRight size={17} />
          </button>
          {mode === "login" && <button type="button" className="auth-text-button" onClick={resetPassword}>パスワードを忘れた場合</button>}
          <p className="auth-switch">
            {mode === "login" ? "はじめて使いますか？" : "すでにアカウントがありますか？"}
            <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "新規登録" : "ログイン"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}

export function FirebaseSetupScreen() {
  return (
    <main className="setup-page">
      <div className="setup-card">
        <span className="setup-icon"><Cloud size={25} /></span>
        <span className="label">FIREBASE SETUP</span>
        <h1>Firebaseとの接続設定が必要です</h1>
        <p><code>.env.example</code> を <code>.env.local</code> にコピーし、FirebaseコンソールのWebアプリ設定を入力してください。</p>
        <pre>cp .env.example .env.local</pre>
        <p className="setup-help">設定後に開発サーバーを再起動すると、ログイン画面が表示されます。</p>
      </div>
    </main>
  );
}

function authErrorMessage(cause: unknown) {
  const code = (cause as { code?: string })?.code;
  const messages: Record<string, string> = {
    "auth/invalid-credential": "メールアドレスまたはパスワードが正しくありません。",
    "auth/email-already-in-use": "このメールアドレスはすでに登録されています。",
    "auth/weak-password": "より安全なパスワードを設定してください。",
    "auth/popup-closed-by-user": "Googleログインがキャンセルされました。",
    "auth/popup-blocked": "ポップアップがブロックされました。ブラウザの設定を確認してください。",
    "auth/unauthorized-domain": "このドメインはFirebase Authenticationで許可されていません。",
    "auth/operation-not-allowed": "Firebase AuthenticationでGoogleログインが有効になっていません。",
    "auth/invalid-api-key": "Firebase APIキーが正しくありません。",
    "auth/network-request-failed": "Firebaseへ接続できませんでした。ネットワーク接続を確認してください。",
    "auth/too-many-requests": "試行回数が多すぎます。少し時間を置いてください。",
  };
  return (
    (code && messages[code]) ||
    `認証できませんでした${code ? `（${code}）` : ""}。Firebaseの設定を確認してください。`
  );
}
