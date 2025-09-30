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

const MAX_QNA_INTERVAL = 5 * 60 * 1000; // 5분 후 질문 가능
const QNA_HISTORY_KEY = "qna_history";

export default function QuizContainer() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [qnaList, setQnaList] = useState([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [lastQnaTime, setLastQnaTime] = useState(0);
  const [tick, setTick] = useState(0);

  // 저장 활성화 플래그 (초기값 false)
  const [isSavingEnabled, setIsSavingEnabled] = useState(false);

  // 강퇴 관련 구독
  useEffect(() => {
    const participantChannel = ably.channels.get(PARTICIPANT_CHANNEL);
    const currentDeviceId = sessionStorage.getItem("current_device_id");
    console.log(currentDeviceId);
    const kickHandler = (message) => {
      const { kick } = message.data;

      if (kick) {
        Swal.fire({
          icon: "warning",
          title: "강퇴되었습니다.",
          text: "호스트에 의해 강퇴되었습니다. 다시 접속할 수 없습니다.",
          confirmButtonText: "확인",
        }).then(() => {
          sessionStorage.clear();
          router.replace("/participant/login");
        });
      }
    };
    participantChannel.subscribe(
      `participant-kicked:${currentDeviceId}`,
      kickHandler
    );
    return () => {
      participantChannel.unsubscribe();
    };
  }, [router]);

  // QnA 기록이 변경될 때마다 sessionStorage에 저장
  useEffect(() => {
    if (isSavingEnabled && typeof window !== "undefined") {
      sessionStorage.setItem(QNA_HISTORY_KEY, JSON.stringify(qnaList));
    }
  }, [qnaList, isSavingEnabled]);

  useEffect(() => {
    const savedNickname = sessionStorage.getItem("quiz_nickname");
    if (!savedNickname) {
      router.replace("/participant/login");
      return;
    }
    setNickname(savedNickname);
    const answered = sessionStorage.getItem(`quiz_answered_${savedNickname}`);
    setIsAnswered(answered === "true");

    // 2. QnA 기록 로드
    const savedQna = sessionStorage.getItem(QNA_HISTORY_KEY);
    try {
      if (savedQna) {
        setQnaList(JSON.parse(savedQna));
      }
    } catch (e) {
      console.error("Failed to parse QnA history on load:", e);
    }

    // 3. QnA 쿨타임 복원
    const lastTime = sessionStorage.getItem("last_qna_time");
    setLastQnaTime(lastTime ? parseInt(lastTime, 10) : 0);

    // 4. Ably 채널 구독 설정
    const hostChannel = ably.channels.get(HOST_CHANNEL);
    const qnaChannel = ably.channels.get(QNA_CHANNEL);
    const participantChannel = ably.channels.get(PARTICIPANT_CHANNEL);

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

    // ⭐️ [공용 리스트 업데이트]: QNA_CHANNEL 수신 시 업데이트
    qnaChannel.subscribe("qna-update", (message) => {
      const qnaItem = message.data;

      // 🚨 중요: 공용 채널을 통해 들어온 피드백 항목이 현재 참가자의 피드백이라면 건너뜁니다.
      //         (개인용 피드백 항목은 아래 participantChannel에서 'my-feedback'으로 추가할 것이기 때문입니다.)
      if (qnaItem.type === "feedback" && qnaItem.nickname === savedNickname) {
        return;
      }

      // 다른 사람의 기록은 모두 여기에 추가됩니다.
      setQnaList((prev) => [...prev, qnaItem]);
    });

    // ⭐️ [개인 알림 및 기록]: 정답 피드백 수신 시 토스트 알림과 개인 상세 기록을 추가
    const feedbackHandler = (message) => {
      const { nickname: feedbackNickname, text, isCorrect } = message.data;

      // 내가 제출한 답안에 대한 피드백인 경우에만
      if (feedbackNickname === savedNickname) {
        // 1. 개인 상세 피드백 기록을 리스트에 추가 (my-feedback 타입으로 저장)
        const feedbackEntry = {
          type: "my-feedback", // ⭐️ 개인용 고유 타입
          nickname: savedNickname,
          text: text,
          isCorrect: isCorrect,
          timestamp: Date.now(),
        };
        setQnaList((prev) => [...prev, feedbackEntry]);

        // 2. 피드백에 따라 Toast 메시지 표시
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 5000,
        });
        Toast.fire({
          icon: isCorrect ? "success" : "error",
          title: isCorrect
            ? `🎉 정답입니다! 다음 퀴즈를 기다려주세요.`
            : `❌ 오답 처리되었습니다.`,
        });
      }
    };
    participantChannel.subscribe("answer-feedback", feedbackHandler);

    // 1초마다 tick을 업데이트 (쿨타임 타이머)
    const intervalId = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    // 5. 모든 초기 로드가 완료되었으므로 저장 활성화
    setIsSavingEnabled(true);

    return () => {
      hostChannel.unsubscribe();
      qnaChannel.unsubscribe();
      participantChannel.unsubscribe("answer-feedback", feedbackHandler);
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

        // 정답을 제출하면 isAnswered를 true로 설정하여 추가 제출을 막습니다.
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
          title: `정답이 제출되었습니다. 호스트의 결과를 기다려주세요.`,
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
