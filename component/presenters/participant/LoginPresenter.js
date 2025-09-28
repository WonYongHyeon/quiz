// presenters/participant/LoginPresenter.js
import styles from "../../styles/LoginStyles.module.css"; // 이전에 제공된 CSS 파일 경로입니다.

export default function LoginPresenter({
  nickname,
  password,
  onNicknameChange,
  onPasswordChange,
  onSubmit,
  error,
  isChecking, // ⭐️ Container에서 전달받는 닉네임 확인 로딩 상태
}) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.loginCard}>
        <h1 className={styles.title}>🙋 참가자 로그인</h1>

        <form onSubmit={onSubmit} className={styles.form}>
          {/* 닉네임 입력 */}
          <div className={styles.formGroup}>
            <label htmlFor="nickname" className={styles.label}>
              닉네임
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => onNicknameChange(e.target.value)}
              placeholder="퀴즈에서 사용할 닉네임을 입력하세요"
              required
              className={styles.input}
              disabled={isChecking} // ⭐️ 확인 중일 때 입력 방지
            />
          </div>

          {/* 패스워드 입력 */}
          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>
              패스워드
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="호스트에게 받은 패스워드를 입력하세요"
              required
              className={styles.input}
              disabled={isChecking} // ⭐️ 확인 중일 때 입력 방지
            />
          </div>

          {/* 에러 및 로딩 메시지 */}
          {(error || isChecking) && (
            <p className={styles.error}>
              {/* isChecking이 true면 에러 대신 로딩 메시지 출력 */}
              {isChecking ? "닉네임 확인 중..." : error}
            </p>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isChecking} // ⭐️ 확인 중일 때 버튼 비활성화
          >
            {isChecking ? "접속 확인 중..." : "접속하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
