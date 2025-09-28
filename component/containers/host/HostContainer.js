// containers/host/HostContainer.js
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import HostPresenter from "../../presenters/host/HostPresenter";
import {
  HOST_CHANNEL,
  PARTICIPANT_CHANNEL,
  QNA_CHANNEL,
  ably,
} from "@/lib/ably";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";

// sessionStorage 키 정의
const PARTICIPANTS_KEY = "host_participants";
const INPUTS_KEY = "host_inputs";
const QUIZ_KEY = "host_current_quiz";

/**
 * sessionStorage에 상태를 저장하는 함수
 */
const saveState = (key, state) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(key, JSON.stringify(state));
  }
};

export default function HostContainer() {
  // 1. 상태 정의 및 Hydration 문제 해결을 위한 isLoaded
  const [currentQuiz, setCurrentQuiz] = useState("");
  const [participants, setParticipants] = useState([]);
  const [inputs, setInputs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 2. 무한 루프 방지를 위해 participants의 최신 값을 참조할 Ref 사용
  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // 3. Hydration 및 Ably 구독 설정
  useEffect(() => {
    if (typeof window !== "undefined") {
      // a. 데이터 로드 및 상태 설정 (Hydration 오류 방지)
      try {
        setCurrentQuiz(JSON.parse(sessionStorage.getItem(QUIZ_KEY) || '""'));
        setParticipants(
          JSON.parse(sessionStorage.getItem(PARTICIPANTS_KEY) || "[]")
        );
        setInputs(JSON.parse(sessionStorage.getItem(INPUTS_KEY) || "[]"));
      } catch (e) {
        console.error("Failed to load state from sessionStorage:", e);
      }
      setIsLoaded(true);
    }

    // b. Ably 채널 구독 (컴포넌트 마운트 시 단 한 번만 실행)
    const participantChannel = ably.channels.get(PARTICIPANT_CHANNEL);

    // 닉네임 중복 체크 요청 처리 (participantsRef 사용)
    const nicknameCheckHandler = async (message) => {
      const { nickname: nicknameToCheck, responseTo: requestId } = message.data;
      const isAvailable = !participantsRef.current.includes(nicknameToCheck);

      const responseChannel = ably.channels.get(
        `participant-response:${requestId}`
      );
      await responseChannel.publish("check-response", {
        available: isAvailable,
      });
    };
    participantChannel.subscribe("nickname-check", nicknameCheckHandler);

    // 새 참가자 등록
    const newParticipantHandler = (message) => {
      const nickname = message.data.nickname;
      setParticipants((prev) => {
        if (!prev.includes(nickname)) {
          return [...prev, nickname];
        }
        return prev;
      });
    };
    participantChannel.subscribe("new-participant", newParticipantHandler);

    // 참가자 입력(질문/정답) 받기 핸들러: 최신이 아래로 가도록 맨 뒤에 추가
    const participantInputHandler = (message) => {
      console.log("참가자 입력 수신:", message.data);
      const input = {
        id: uuidv4(),
        nickname: message.data.nickname,
        type: message.data.type, // "question" 또는 "answer"
        text: message.data.text,
        timestamp: message.data.timestamp,
        isCorrect: null, // 정답 여부 (정답 처리 전)
        hostAnswer: null, // 호스트 답변 (답변 전)
        processedAt: null, // ⭐️ 처리 시각 필드 추가
      };
      setInputs((prev) => [...prev, input]);
    };
    participantChannel.subscribe("participant-input", participantInputHandler);

    return () => {
      // 컴포넌트 언마운트 시 구독 해제
      participantChannel.unsubscribe("nickname-check", nicknameCheckHandler);
      participantChannel.unsubscribe("new-participant", newParticipantHandler);
      participantChannel.unsubscribe(
        "participant-input",
        participantInputHandler
      );
    };
  }, []);

  // 4. 상태 변경 시 sessionStorage에 저장 (isLoaded 이후에만 실행)
  useEffect(() => {
    if (isLoaded) saveState(QUIZ_KEY, currentQuiz);
  }, [currentQuiz, isLoaded]);

  useEffect(() => {
    if (isLoaded) saveState(PARTICIPANTS_KEY, participants);
  }, [participants, isLoaded]);

  useEffect(() => {
    if (isLoaded) saveState(INPUTS_KEY, inputs);
  }, [inputs, isLoaded]);

  // 5. 퀴즈 입력 및 전송
  const handleQuizSubmit = useCallback(async (quizText) => {
    setCurrentQuiz(quizText);
    try {
      const channel = ably.channels.get(HOST_CHANNEL);
      // 퀴즈 업데이트 신호를 참가자에게 전송
      await channel.publish("quiz-update", { quiz: quizText });
      const Toast = Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      Toast.fire({
        icon: "success",
        title: `퀴즈가 모든 참가자에게 전송되었습니다.`,
      });
    } catch (err) {
      console.error("퀴즈 전송 오류:", err);
      alert("퀴즈 전송에 실패했습니다.");
    }
  }, []);

  // 6. 질문에 대한 호스트 답변 전송
  const handleHostAnswerSubmit = useCallback(
    async (inputId, answer) => {
      const originalInput = inputs.find((i) => i.id === inputId);
      if (!originalInput) return;

      setInputs((prevInputs) =>
        prevInputs.map((input) =>
          input.id === inputId
            ? {
                ...input,
                hostAnswer: answer,
                processedAt: Date.now(), // ⭐️ 처리 시각 기록
              }
            : input
        )
      );

      const qnaData = {
        type: "question",
        nickname: originalInput.nickname,
        text: originalInput.text,
        hostAnswer: answer,
        timestamp: Date.now(),
      };

      try {
        const channel = ably.channels.get(QNA_CHANNEL);
        await channel.publish("qna-update", qnaData);
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
        console.error("QnA 전송 오류:", err);
      }
    },
    [inputs]
  );

  // 7. 정답 처리 (정답/오답 버튼 클릭) 및 초기화 신호 전송
  const handleAnswerDecision = useCallback(
    async (inputId, isCorrect) => {
      const selectedInput = inputs.find((input) => input.id === inputId);

      if (!selectedInput) return;

      // 1. 상태 업데이트: isCorrect 마크 및 processedAt 기록
      setInputs((prevInputs) =>
        prevInputs.map((input) =>
          input.id === inputId
            ? {
                ...input,
                isCorrect: isCorrect,
                processedAt: Date.now(), // ⭐️ 처리 시각 기록
              }
            : input
        )
      );

      const feedbackData = {
        type: "feedback", // ⭐️ QNA_CHANNEL에 발행할 때 사용될 타입
        nickname: selectedInput.nickname,
        text: selectedInput.text,
        isCorrect: isCorrect,
        timestamp: Date.now(),
      };

      // ⭐️ 정답/오답 처리 피드백 메시지 전송 (퀴즈 리셋 여부와 관계없이 실행)
      try {
        // 1) 개인 참가자 채널에 피드백 전송 (개별 알림/기록용)
        const participantChannel = ably.channels.get(PARTICIPANT_CHANNEL);
        await participantChannel.publish("answer-feedback", feedbackData);

        // 2) ⭐️ QNA_CHANNEL에 피드백 전송 (모두에게 공유되는 공개 기록용)
        const qnaChannel = ably.channels.get(QNA_CHANNEL);
        await qnaChannel.publish("qna-update", feedbackData);
      } catch (err) {
        console.error("정답 피드백 전송 오류:", err, selectedInput);
      }

      // 2. SweetAlert2 알림 및 전체 목록 초기화 (정답일 경우만)
      if (isCorrect) {
        Swal.fire({
          title: "🎉 정답 처리 완료!",
          html: `
                <div style="text-align: left; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9; color: #333;">
                    <p style="font-weight: bold; margin-bottom: 5px;">✅ 정답자: ${selectedInput.nickname}</p>
                    <p style="font-weight: bold; margin-bottom: 5px;">💡 제출 답안: ${selectedInput.text}</p>
                    <p style="margin-top: 15px; color: #e74c3c;">❗️ 퀴즈 관련 모든 미처리 질문 및 답안 목록이 초기화됩니다.</p>
                </div>
            `,
          icon: "success",
          confirmButtonText: "다음 퀴즈로",
        }).then(async () => {
          // 3. 호스트 상태 초기화
          setInputs([]);
          setCurrentQuiz("");

          // 4. 참가자 초기화 메시지 전송
          try {
            const channel = ably.channels.get(HOST_CHANNEL);
            await channel.publish("quiz-reset", {
              message: "Host has ended the quiz and reset the state.",
            });
            console.log("Quiz reset signal sent to participants.");
          } catch (err) {
            console.error("퀴즈 초기화 신호 전송 오류:", err);
          }
        });
      } else {
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        Toast.fire({
          icon: "error",
          title: `[오답] 처리 - ${selectedInput.nickname}의 답안이 오답으로 표시되었습니다.`,
        });
      }
    },
    [inputs]
  );

  // 8. 입력 항목 삭제 핸들러 추가
  const handleDeleteInput = useCallback((inputId) => {
    Swal.fire({
      title: "정말로 삭제하시겠습니까?",
      text: "이 작업은 되돌릴 수 없습니다.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    }).then((result) => {
      if (result.isConfirmed) {
        setInputs((prevInputs) =>
          prevInputs.filter((input) => input.id !== inputId)
        );
        Swal.fire(
          "삭제 완료!",
          "해당 항목이 목록에서 제거되었습니다.",
          "success"
        );
      }
    });
  }, []);

  // 9. Hydration 완료 전에는 로딩 UI 반환
  if (!isLoaded) {
    return (
      <div
        style={{
          backgroundColor: "#121212",
          minHeight: "100vh",
          color: "#e0e0e0",
          textAlign: "center",
          paddingTop: "50px",
        }}
      >
        콘솔 로드 중...
      </div>
    );
  }

  // 10. Presenter에 전달할 데이터 준비
  // 미처리 질문: 답변이 없는 질문
  const questions = inputs.filter(
    (i) => i.type === "question" && !i.hostAnswer
  );
  // 미처리 정답: 정답 여부가 결정되지 않은 정답 제출
  const answers = inputs.filter(
    (i) => i.type === "answer" && i.isCorrect === null
  );

  // ⭐️ 처리된 기록(리스트) 필터링
  const rawProcessedList = inputs.filter(
    (i) =>
      (i.type === "question" && i.hostAnswer) ||
      (i.type === "answer" && i.isCorrect !== null)
  );

  // ⭐️ 처리 시각(processedAt)을 기준으로 오름차순 정렬 (오래된 것이 위, 최신이 아래)
  const processedList = rawProcessedList.sort(
    (a, b) => a.processedAt - b.processedAt
  );

  return (
    <HostPresenter
      currentQuiz={currentQuiz}
      participants={participants}
      questions={questions}
      answers={answers}
      processedList={processedList}
      onQuizSubmit={handleQuizSubmit}
      onHostAnswerSubmit={handleHostAnswerSubmit}
      onAnswerDecision={handleAnswerDecision}
      onDeleteInput={handleDeleteInput}
    />
  );
}
