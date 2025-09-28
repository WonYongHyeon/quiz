// presenters/MainPresenter.js
import styles from "../styles/MainStyles.module.css";

export default function MainPresenter({ onHostClick, onParticipantClick }) {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>실시간 퀴즈 방송!</h1>
      <p className={styles.subtitle}>역할을 선택해 주세요</p>
      <div className={styles.buttonGroup}>
        <button className={styles.button} onClick={onHostClick}>
          🎤 호스트 (Host)
        </button>
        <button className={styles.button} onClick={onParticipantClick}>
          🙋 참가자 (Participant)
        </button>
      </div>
    </div>
  );
}
