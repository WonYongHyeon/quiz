// presenters/host/HostPresenter.js (수정된 전체 코드)
import { useState } from "react";
import styles from "../../styles/HostStyles.module.css";

// ⭐️ 1. 처리된 기록 셀 컴포넌트
function ProcessedCell({ input, onDeleteInput }) {
  const isQuestion = input.type === "question";

  // 타입에 따른 제목/내용 설정
  let statusText = "";
  let statusClass = styles.statusNormal;

  if (isQuestion) {
    statusText = "✅ 답변 완료";
    statusClass = styles.statusAnswered;
  } else if (input.isCorrect === true) {
    statusText = "🎉 정답 처리";
    statusClass = styles.statusCorrect;
  } else if (input.isCorrect === false) {
    statusText = "❌ 오답 처리";
    statusClass = styles.statusIncorrect;
  }

  return (
    <div className={styles.cell} data-processed="true" data-type={input.type}>
      <button
        onClick={() => onDeleteInput(input.id)}
        className={styles.deleteButton}
        title="삭제"
      >
        X
      </button>
      <p className={styles.cellHeader}>
        [{input.nickname}] {isQuestion ? "질문" : "정답 제출"}
        <span className={statusClass}>{statusText}</span>
      </p>
      <p className={styles.cellContent}>{input.text}</p>

      {isQuestion && input.hostAnswer && (
        <div className={styles.processedAnswer}>
          <p className={styles.hostAnswerTitle}>Host 답변:</p>
          <p className={styles.hostAnswerContent}>"{input.hostAnswer}"</p>
        </div>
      )}
    </div>
  );
}

// 질문-답변 셀 컴포넌트
function QnaCell({ input, onHostAnswerSubmit, onDeleteInput }) {
  const [answer, setAnswer] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answer.trim()) {
      onHostAnswerSubmit(input.id, answer);
      setAnswer("");
    }
  };

  return (
    <div className={styles.cell}>
      <button
        onClick={() => onDeleteInput(input.id)}
        className={styles.deleteButton}
        title="삭제"
      >
        X
      </button>
      <p className={styles.cellHeader}>🙋 {input.nickname}의 질문:</p>
      <p className={styles.cellContent}>"{input.text}"</p>
      <form onSubmit={handleSubmit} className={styles.cellForm}>
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="답변 입력..."
          className={styles.cellInput}
        />
        <button type="submit" className={styles.answerButton}>
          답변 전송
        </button>
      </form>
    </div>
  );
}

// 정답 처리 셀 컴포넌트
function AnswerCell({ input, onAnswerDecision, onDeleteInput }) {
  const isProcessed = input.isCorrect !== null;

  return (
    <div className={styles.cell} data-processed={isProcessed}>
      <button
        onClick={() => onDeleteInput(input.id)}
        className={styles.deleteButton}
        title="삭제"
      >
        X
      </button>
      <p className={styles.cellHeader}>✅ {input.nickname}의 정답 제출:</p>
      <p className={styles.cellContent}>"{input.text}"</p>
      <div className={styles.decisionGroup}>
        <button
          onClick={() => onAnswerDecision(input.id, true)}
          disabled={isProcessed}
          className={styles.correctButton}
        >
          {isProcessed && input.isCorrect ? "✅ 정답 처리됨" : "정답"}
        </button>
        <button
          onClick={() => onAnswerDecision(input.id, false)}
          disabled={isProcessed}
          className={styles.incorrectButton}
        >
          {isProcessed && !input.isCorrect ? "❌ 오답 처리됨" : "오답"}
        </button>
      </div>
    </div>
  );
}

export default function HostPresenter({
  currentQuiz,
  participants,
  questions,
  answers,
  processedList,
  onQuizSubmit,
  onHostAnswerSubmit,
  onAnswerDecision,
  onDeleteInput, // ⭐️ 삭제 핸들러 props 받기
  onKickModalOpen, // 강퇴 관리 모달 열기 핸들러
}) {
  const [quizInput, setQuizInput] = useState(currentQuiz || "");

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (quizInput.trim()) {
      onQuizSubmit(quizInput);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>🎤 퀴즈 호스트 콘솔</h1>
        <form onSubmit={handleQuizSubmit} className={styles.quizForm}>
          <input
            type="text"
            value={quizInput}
            onChange={(e) => setQuizInput(e.target.value)}
            placeholder="새로운 퀴즈 문제 입력 후 전송..."
            className={styles.quizInput}
          />
          <button type="submit" className={styles.quizButton}>
            퀴즈 전송
          </button>
        </form>
        <div className={styles.quizInfoRow}>
          <p className={styles.currentQuiz}>
            현재 퀴즈: {currentQuiz || "입력 대기 중"}
          </p>
          <p className={styles.participantCount}>
            참가자 수: {participants.length}명
          </p>
          <button className={styles.kickButton} onClick={onKickModalOpen}>
            강퇴 관리
          </button>
        </div>
      </header>

      <div className={styles.mainContent}>
        {/* 왼쪽 섹션: 참가자 질문 */}
        <section className={styles.leftSection}>
          <h3 className={styles.sectionTitle}>💬 참가자 질문 (미처리)</h3>
          <div className={styles.inputList}>
            {questions.length === 0 ? (
              <p className={styles.emptyMessage}>새로운 질문이 없습니다.</p>
            ) : (
              questions.map((input) => (
                <QnaCell
                  key={input.id}
                  input={input}
                  onHostAnswerSubmit={onHostAnswerSubmit}
                  onDeleteInput={onDeleteInput} // ⭐️ 핸들러 전달
                />
              ))
            )}
          </div>
        </section>

        {/* 중앙 섹션: 참가자 정답 */}
        <section className={styles.centerSection}>
          <h3 className={styles.sectionTitle}>🎯 참가자 정답 (미처리)</h3>
          <div className={styles.inputList}>
            {answers.length === 0 ? (
              <p className={styles.emptyMessage}>새로운 정답이 없습니다.</p>
            ) : (
              answers.map((input) => (
                <AnswerCell
                  key={input.id}
                  input={input}
                  onAnswerDecision={onAnswerDecision}
                  onDeleteInput={onDeleteInput} // ⭐️ 핸들러 전달
                />
              ))
            )}
          </div>
        </section>

        {/* 오른쪽 섹션: 처리된 활동 기록 (리스트) */}
        <section className={styles.rightSection}>
          <h3 className={styles.sectionTitle}>📋 처리된 활동 기록</h3>
          <div className={styles.inputList}>
            {processedList.length === 0 ? (
              <p className={styles.emptyMessage}>처리된 기록이 없습니다.</p>
            ) : (
              processedList.map((input) => (
                <ProcessedCell
                  key={input.id}
                  input={input}
                  onDeleteInput={onDeleteInput} // ⭐️ 핸들러 전달
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
