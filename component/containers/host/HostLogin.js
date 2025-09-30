// components/host/HostLogin.js
import { useState } from "react";
import styles from "../../styles/HostLogin.module.css";

export default function HostLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // 💡 실제 비밀번호는 환경 변수 (NEXT_PUBLIC_HOST_PASSWORD) 또는 '1234'를 사용합니다.
    const CORRECT_PASSWORD =
      process.env.NEXT_PUBLIC_HOST_PASSWORD || "pigvelyn";

    if (password === CORRECT_PASSWORD) {
      onLogin(true);
    } else {
      setError("❌ 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>호스트 콘솔 접근</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.label}>비밀번호를 입력하세요:</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          placeholder="비밀번호"
          required
        />
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.button}>
          접속
        </button>
      </form>
    </div>
  );
}
