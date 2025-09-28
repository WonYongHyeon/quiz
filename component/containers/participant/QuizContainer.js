// containers/participant/QuizContainer.js
"use client";
import { useState, useEffect, useCallback } from "react";
import QuizPresenter from "../../presenters/participant/QuizPresenter";
import {
  HOST_CHANNEL,
  PARTICIPANT_CHANNEL,
  QNA_CHANNEL,
  ably,
} from "@/lib/ably";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

const MAX_QNA_INTERVAL = 10 * 1000; // 10초 후 질문 가능
const QNA_HISTORY_KEY = "qna_history";

// loadQnaHistory 함수는 제거되었습니다. 로드 로직은 useEffect 내부에서 실행됩니다.

export default function QuizContainer() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [currentQuiz, setCurrentQuiz] = useState(null);
  // qnaList 초기값은 Hydration 오류를 피하기 위해 빈 배열로 설정 유지
  const [qnaList, setQnaList] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lastQnaTime, setLastQnaTime] = useState(0);
  const [tick, setTick] = useState(0);

  // ⭐️ 새로운 상태: 저장 활성화 플래그 (초기값 false)
  const [isSavingEnabled, setIsSavingEnabled] = useState(false);

  // ⭐️ QnA 기록이 변경될 때마다 sessionStorage에 저장
  // isSavingEnabled가 true일 때만 저장 로직을 실행하여 덮어쓰기를 방지합니다.
  useEffect(() => {
    if (isSavingEnabled && typeof window !== "undefined") {
      sessionStorage.setItem(QNA_HISTORY_KEY, JSON.stringify(qnaList));
    }
  }, [qnaList, isSavingEnabled]); // 의존성 배열에 isSavingEnabled 추가

  useEffect(() => {
    // 1. 로그인 확인 및 초기 설정
    const savedNickname = sessionStorage.getItem("quiz_nickname");
    if (!savedNickname) {
      router.replace("/participant/login");
      return;
    }
    setNickname(savedNickname);
    const answered = sessionStorage.getItem(`quiz_answered_${savedNickname}`);
    setIsAnswered(answered === "true");

    // ⭐️ 2. QnA 기록 로드 (클라이언트에서만 실행되어 Hydration 오류 방지)
    const savedQna = sessionStorage.getItem(QNA_HISTORY_KEY);
    try {
      if (savedQna) {
        setQnaList(JSON.parse(savedQna));
      }
    } catch (e) {
      console.error("Failed to parse QnA history on load:", e);
    }

    // 3. QnA 쿨타임 복원 (클라이언트에서만 실행)
    const lastTime = sessionStorage.getItem("last_qna_time");
    setLastQnaTime(lastTime ? parseInt(lastTime, 10) : 0);

    // 4. Ably 채널 구독 설정
    const hostChannel = ably.channels.get(HOST_CHANNEL);
    const qnaChannel = ably.channels.get(QNA_CHANNEL);

    // 퀴즈 업데이트 시 초기화
    hostChannel.subscribe("quiz-update", (message) => {
      setCurrentQuiz(message.data.quiz);

      if (message.data.quiz) {
        setIsAnswered(false);
        sessionStorage.removeItem(`quiz_answered_${savedNickname}`);
        setQnaList([]);
        sessionStorage.removeItem(QNA_HISTORY_KEY);
      }
    });

    // 호스트 리셋 시 초기화
    const resetHandler = () => {
      setCurrentQuiz(null);
      setQnaList([]);
      sessionStorage.removeItem(QNA_HISTORY_KEY);
      setIsAnswered(false);
      sessionStorage.removeItem(`quiz_answered_${savedNickname}`);
      console.log("Quiz successfully reset by host.");
    };
    hostChannel.subscribe("quiz-reset", resetHandler);

    // QnA 수신 시 업데이트
    qnaChannel.subscribe("qna-update", (message) => {
      setQnaList((prev) => [...prev, message.data]);
    });

    // 1초마다 tick을 업데이트 (쿨타임 타이머)
    const intervalId = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    // ⭐️ 5. 모든 초기 로드가 완료되었으므로 저장 활성화
    setIsSavingEnabled(true);

    return () => {
      hostChannel.unsubscribe();
      qnaChannel.unsubscribe();
      clearInterval(intervalId);
    };
  }, [router]);

  // 첫 번째 입력: 질문 (QnA) 제출
  const handleQnaSubmit = useCallback(
    async (question) => {
      const now = Date.now();
      const elapsedTime = now - lastQnaTime;

      if (elapsedTime < MAX_QNA_INTERVAL) {
        const remainingSeconds = Math.ceil(
          (MAX_QNA_INTERVAL - elapsedTime) / 1000
        );
        alert(`아직 쿨타임이 남았습니다. (${remainingSeconds}초 후 질문 가능)`);
        return;
      }

      try {
        const channel = ably.channels.get(PARTICIPANT_CHANNEL);
        const qnaData = {
          type: "question",
          nickname,
          text: question,
          timestamp: now,
        };
        await channel.publish("participant-input", qnaData);

        setLastQnaTime(now);
        sessionStorage.setItem("last_qna_time", now.toString());
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        Toast.fire({
          icon: "success",
          title: `QnA 전송 완료`,
        });
      } catch (err) {
        console.error("질문 전송 오류:", err);
        alert("질문 전송에 실패했습니다.");
      }
    },
    [nickname, lastQnaTime]
  );

  // 두 번째 입력: 정답 제출
  const handleAnswerSubmit = useCallback(
    async (answer) => {
      if (isAnswered) return;

      try {
        const channel = ably.channels.get(PARTICIPANT_CHANNEL);
        const answerData = {
          type: "answer",
          nickname,
          text: answer,
          timestamp: Date.now(),
        };
        await channel.publish("participant-input", answerData);

        setIsAnswered(true);
        sessionStorage.setItem(`quiz_answered_${nickname}`, "true");
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        Toast.fire({
          icon: "success",
          title: `정답이 제출되었습니다.`,
        });
      } catch (err) {
        console.error("정답 전송 오류:", err);
        alert("정답 전송에 실패했습니다.");
      }
    },
    [nickname, isAnswered]
  );

  // 남은 쿨타임 계산
  const remainingCooldown = Math.max(
    0,
    Math.ceil((MAX_QNA_INTERVAL - (Date.now() - lastQnaTime)) / 1000)
  );

  return (
    <QuizPresenter
      nickname={nickname}
      currentQuiz={currentQuiz}
      qnaList={qnaList}
      isAnswered={isAnswered}
      remainingCooldown={remainingCooldown}
      onQnaSubmit={handleQnaSubmit}
      onAnswerSubmit={handleAnswerSubmit}
    />
  );
}
