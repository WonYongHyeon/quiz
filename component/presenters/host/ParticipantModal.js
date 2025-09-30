import React from "react";
import styles from "../../styles/HostStyles.module.css";

export default function ParticipantModal({ participants, onClose, onBan }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>참가자 목록</h2>
        <button className={styles.closeButton} onClick={onClose}>
          닫기
        </button>
        <ul className={styles.participantList}>
          {participants.map((participant) => (
            <li key={participant.deviceId} className={styles.participantItem}>
              <span>{participant.nickname}</span>
              <button
                className={styles.banButton}
                onClick={() => onBan(participant.deviceId)}
              >
                강퇴
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
