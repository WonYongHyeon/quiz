// presenters/participant/QuizPresenter.js
import styles from "../../styles/QuizStyles.module.css";
import { useState } from "react";

export default function QuizPresenter({
  nickname,
  currentQuiz,
  qnaList,
  isAnswered,
  remainingCooldown,
  onQnaSubmit,
  onAnswerSubmit,
}) {
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const quizText = currentQuiz || "호스트가 문제를 입력중입니다...";

  const handleQnaSubmit = (e) => {
    e.preventDefault();
    if (questionInput.trim() && remainingCooldown === 0) {
      onQnaSubmit(questionInput);
      setQuestionInput("");
    }
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (answerInput.trim() && !isAnswered) {
      onAnswerSubmit(answerInput);
    }
  };

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <h2 className={styles.quizTitle}>📢 현재 퀴즈: {quizText}</h2>
      </header>

      <div className={styles.mainContent}>
        {/* 왼쪽 섹션: 입력 칸 */}
        <section className={styles.inputSection}>
          <h3 className={styles.sectionTitle}>
            질문 및 정답 입력 (참가자: {nickname})
          </h3>

          {/* 질문 입력 (쿨타임 적용) */}
          <form onSubmit={handleQnaSubmit} className={styles.formGroup}>
            <label className={styles.label}>질문하기 (10분당 1회)</label>
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              disabled={remainingCooldown > 0}
              className={styles.input}
              placeholder={
                remainingCooldown > 0
                  ? `${remainingCooldown}초 후 질문 가능`
                  : "호스트에게 질문 입력..."
              }
            />
            <button
              type="submit"
              disabled={remainingCooldown > 0 || !questionInput.trim()}
              className={styles.submitButton}
            >
              질문 전송 ({Math.floor(remainingCooldown / 60)}분{" "}
              {remainingCooldown % 60}초 대기)
            </button>
          </form>

          {/* 정답 입력 (한 번만 가능) */}
          <form onSubmit={handleAnswerSubmit} className={styles.formGroup}>
            <label className={styles.label}>정답 입력</label>
            <input
              type="text"
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              disabled={isAnswered}
              className={styles.input}
              placeholder={
                isAnswered ? "이미 정답을 제출했습니다." : "정답 입력..."
              }
            />
            <button
              type="submit"
              disabled={isAnswered || !answerInput.trim()}
              className={
                isAnswered ? styles.disabledButton : styles.submitButton
              }
            >
              정답 제출
            </button>
          </form>
        </section>

        {/* 오른쪽 섹션: QnA 리스트 (모두 공유) */}
        <section className={styles.listSection}>
          <h3 className={styles.sectionTitle}>모든 참가자 Q&A 기록</h3>
          <div className={styles.qnaList}>
            {qnaList.length === 0 ? (
              <p className={styles.emptyMessage}>아직 질문/답변이 없습니다.</p>
            ) : (
              qnaList.map((qna, index) => (
                <div
                  key={index}
                  className={
                    qna.type === "answer"
                      ? styles.qnaAnswerItem
                      : styles.qnaQuestionItem
                  }
                >
                  <p>
                    <strong>{qna.nickname}</strong>: {qna.text}
                  </p>
                  {qna.hostAnswer && (
                    <p className={styles.hostResponse}>
                      └ 🧑‍💻 호스트 답변: {qna.hostAnswer}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
