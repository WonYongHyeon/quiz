"use client";

import { useEffect, useRef, useState } from "react";
import HostGameUI from "./game.presenter";
import Ably from "ably";
import { toast } from "sonner";

const ably = new Ably.Realtime({
  key: "2TTOtA.FJWgLw:xe4Vj2BJjFVo8rJ4_73BKPLEi5Rd6FHUtwx31sngmlg",
});

export default function HostGame() {
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [participants, setParticipants] = useState({});
  const [isCheckingScore, setIsCheckingScore] = useState(false);

  // ✅ 1. 최신 정답을 저장하기 위한 ref 생성
  const correctAnswerRef = useRef(correctAnswer);

  const sendQuizChannelRef = useRef(null);
  const updateScoreChannelRef = useRef(null);
  const timerRef = useRef(null);

  const handleQuestionChange = (e) => setQuestion(e.target.value);
  const handleAnswerChange = (e) => setCorrectAnswer(e.target.value);
  const handelLimitChange = (e) => setTimeLimit(e.target.value);

  // ✅ 2. correctAnswer 상태가 변경될 때마다 ref의 값을 업데이트
  useEffect(() => {
    correctAnswerRef.current = correctAnswer;
  }, [correctAnswer]);

  const sendQuiz = () => {
    // ... (기존 유효성 검사 로직은 동일)
    if (
      question.trim().length === 0 ||
      correctAnswer.trim().length === 0 ||
      timeLimit <= 0
    ) {
      toast.error("문제, 정답, 제한시간을 모두 올바르게 입력해주세요.");
      return;
    }

    setIsCheckingScore(false);
    setParticipants((prev) => {
      const resetParticipants = { ...prev };
      Object.keys(resetParticipants).forEach((nickname) => {
        delete resetParticipants[nickname].answer;
      });
      return resetParticipants;
    });

    sendQuizChannelRef.current.publish("send-quiz", { question, timeLimit });
    console.log("문제 출제:", { question, timeLimit });

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      console.log("제한시간 종료! 점수를 계산합니다.");

      setParticipants((currentParticipants) => {
        const updatedParticipants = JSON.parse(
          JSON.stringify(currentParticipants)
        );

        Object.keys(updatedParticipants).forEach((nickname) => {
          const participant = updatedParticipants[nickname];
          // ✅ 4. 점수 계산 시 ref에 저장된 최신 정답을 사용
          if (
            participant.answer &&
            participant.answer === correctAnswerRef.current.trim()
          ) {
            participant.score += 1;
          }
        });

        console.log("업데이트된 참가자 점수:", updatedParticipants);
        updateScoreChannelRef.current.publish("update-score", {
          participants: updatedParticipants,
          isCheckingScore: true,
        });

        setIsCheckingScore(true);
        return updatedParticipants;
      });
    }, timeLimit * 1000);
  };

  // ✅ 3. Ably 채널 설정은 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    sendQuizChannelRef.current = ably.channels.get("send-quiz");
    updateScoreChannelRef.current = ably.channels.get("update-score");
    const receiveAnswerChannel = ably.channels.get("receive-answer");
    const checkChannel = ably.channels.get("check-nickname-channel");

    // ✅ [수정됨] 정답 수신 처리 함수
    const handleReceiveAnswer = (message) => {
      const { nickname, answer } = message.data;

      setParticipants((prev) => {
        // 기존 참가자 정보를 가져오거나, 없다면 score: 0으로 기본 객체를 생성합니다.
        const existingParticipant = prev[nickname] || { score: 0 };

        return {
          ...prev,
          [nickname]: {
            ...existingParticipant, // 이제 score가 항상 보장됩니다.
            answer: answer,
          },
        };
      });
      toast.success(`${nickname} 님이 정답을 제출했습니다.`);
    };

    // 닉네임 확인 처리
    const handleCheckNickname = (message) => {
      const requestedNickname = message.data.name;
      setParticipants((prev) => {
        const isTaken = !!prev[requestedNickname];
        checkChannel.publish(`nickname-response-${requestedNickname}`, {
          status: isTaken ? "taken" : "ok",
        });
        if (!isTaken) {
          return { ...prev, [requestedNickname]: { score: 0 } };
        }
        return prev;
      });
    };

    receiveAnswerChannel.subscribe("receive-answer", handleReceiveAnswer);
    checkChannel.subscribe("check-nickname", handleCheckNickname);

    // 컴포넌트 언마운트 시 모든 구독을 해제하고 채널을 정리
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      // unsubscribe 후 release 하는 것이 더 안정적일 수 있습니다.
      receiveAnswerChannel.unsubscribe(handleReceiveAnswer);
      checkChannel.unsubscribe(handleCheckNickname);

      ably.channels.release("send-quiz");
      ably.channels.release("update-score");
      ably.channels.release("receive-answer");
      ably.channels.release("check-nickname-channel");
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 설정

  return (
    <HostGameUI
      handleQuestionChange={handleQuestionChange}
      handleAnswerChange={handleAnswerChange}
      handelLimitChange={handelLimitChange}
      sendQuiz={sendQuiz}
      isCheckingScore={isCheckingScore}
      participants={participants}
    />
  );
}
