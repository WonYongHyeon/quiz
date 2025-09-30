import React from "react";
import ReactDOM from "react-dom";
import styles from "../../styles/HostStyles.module.css"; // CSS 파일 임포트 추가

export default function ParticipantKickModal({
  participants,
  onClose,
  onKick,
}) {
  return ReactDOM.createPortal(
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>참가자 관리</h2>
          <button onClick={onClose}>X</button>
        </div>
        <ul className={styles.participantList}>
          {participants.length === 0 ? (
            <p className={styles.noParticipants}>참가자가 없습니다.</p>
          ) : null}
          {participants.map((participant) => (
            <li key={participant.deviceId}>
              {participant.nickname}
              <button onClick={() => onKick(participant.deviceId)}>강퇴</button>
            </li>
          ))}
        </ul>
      </div>
    </div>,
    document.body
  );
}
