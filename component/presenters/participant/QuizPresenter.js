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
              qnaList.map((qna, index) => {
                // 1. ⭐️ 개인 상세 피드백 렌더링 (type: my-feedback)
                // 이 항목은 본인만 가지고 있으며, 상세한 답안 텍스트까지 표시합니다.
                if (qna.type === "my-feedback") {
                  return (
                    <div
                      key={index}
                      className={
                        qna.isCorrect
                          ? styles.qnaCorrectFeedback
                          : styles.qnaIncorrectFeedback
                      }
                    >
                      <p>🧑‍💻 **호스트 처리 결과 (본인 기록)**</p>
                      <p className={styles.hostResponse}>
                        **[내가 제출한 답안]** "{qna.text}" -{" "}
                        {qna.isCorrect ? "🎉 정답 처리" : "❌ 오답 처리"}
                      </p>
                    </div>
                  );
                }

                // 2. ⭐️ 공용 피드백 렌더링 (type: feedback)
                // 다른 사람의 기록은 이 로직으로 모두에게 표시되며, 답안 내용도 포함합니다.
                if (qna.type === "feedback") {
                  const decision = qna.isCorrect ? "🎉 정답" : "❌ 오답";
                  const itemStyle = qna.isCorrect
                    ? styles.qnaCorrectFeedback
                    : styles.qnaIncorrectFeedback;

                  return (
                    <div key={index} className={itemStyle}>
                      {/* <p>🧑‍💻 **참가자 정답 처리 공지**</p> */}
                      {/* 🚨 수정: 제출된 답안 내용(qna.text)을 여기에 추가합니다. */}
                      <p className={styles.hostResponse}>
                        "{qna.nickname}" 님의 답안이 {decision} 처리되었습니다.
                      </p>
                      <p className={styles.hostResponse}>
                        [제출 답안] "{qna.text}"
                      </p>
                    </div>
                  );
                }

                // 3. 기존 질문/QnA 렌더링
                return (
                  <div
                    key={index}
                    className={
                      qna.type === "answer"
                        ? styles.qnaAnswerItem
                        : styles.qnaQuestionItem
                    }
                  >
                    <p className={styles.qnaText}>
                      <strong>{qna.nickname}</strong> : {qna.text}
                    </p>
                    {qna.hostAnswer && (
                      <p className={styles.hostResponse}>
                        └ 🧑‍💻 답변: {qna.hostAnswer}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
