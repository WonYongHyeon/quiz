"use client";

import { useEffect, useRef, useState } from "react";
import HostGameUI from "./game.presenter";
import Ably from "ably";
import { toast } from "sonner";

const ably = new Ably.Realtime({
  key: "2TTOtA.FJWgLw:xe4Vj2BJjFVo8rJ4_73BKPLEi5Rd6FHUtwx31sngmlg",
});

export default function HostGame() {
  const [message, setMessage] = useState({});
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [participants, setParticipants] = useState({});
  const [memberAnswerList, setMemberAnswerList] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [isCheckingScore, setIsCheckingScore] = useState(false);

  const sendQuizChannelRef = useRef(null);
  const receiveAnswerChannelRef = useRef(null);
  const updateScoreChannelRef = useRef(null);

  const timerRef = useRef(null);

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
  };
  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
  };
  const handelLimitChange = (e) => {
    setTimeLimit(e.target.value);
  };

  // 문제 출제 버튼 클릭 시 호출되는 함수
  const sendQuiz = () => {
    if (question.trim().length === 0) {
      toast.error("문제를 입력해주세요.");
      return;
    }
    if (answer.trim().length === 0) {
      toast.error("정답을 입력해주세요.");
      return;
    }
    if (timeLimit === 0) {
      toast.error("제한시간을 입력해주세요.");
      return;
    }

    const messagePayload = {
      question,
      timeLimit,
      type: "object",
    };

    // 객체를 그대로 publish 합니다.
    sendQuizChannelRef.current.publish("send-quiz", messagePayload);
    console.log("문제 출제:", messagePayload);

    // 제한 시간이 끝나면 점수를 계산
    // timeLimit * 1000 밀리초 후에 아래 함수를 "한 번만" 실행합니다.
    timerRef.current = setTimeout(() => {
      console.log("제한시간이 끝났습니다. 점수를 계산합니다.");

      // 여기에 점수 계산 로직을 넣습니다.
      console.log("점수 계산 로직 실행 : ", memberAnswerList);

      // 문제와 시간 리셋
      setAnswer("");
      setQuestion("");
      setTimeLimit(0);
    }, timeLimit * 1000);

    // 컴포넌트가 사라질 때 타이머를 정리합니다. (메모리 누수 방지)
    return () => clearInterval(timer);
  };

  const updateScore = (userId, score) => {
    // --- ⭐️ 점수 업데이트 ---
    const updateScoreChannel = updateScoreChannelRef.current;
    updateScoreChannel.publish("update-score", { userId, score });
  };

  // 참가자에게 퀴즈를 보내는 채널을 생성
  // 참가자에게 점수를 업데이트하는 채널을 생성
  useEffect(() => {
    const sendQuizChannel = ably.channels.get("send-quiz");
    const updateScoreChannel = ably.channels.get("update-score");
    sendQuizChannelRef.current = sendQuizChannel;
    updateScoreChannelRef.current = updateScoreChannel;

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      sendQuizChannel.detach();
      updateScoreChannel.detach();
    };
  }, []);

  // 참가자가 정답을 제출했을 때 호출되는 함수
  useEffect(() => {
    const receiveAnswerChannel = ably.channels.get("receive-answer");
    receiveAnswerChannelRef.current = receiveAnswerChannel;

    // 'receive-answer' 이벤트로 들어온 객체를 구독
    receiveAnswerChannel.subscribe("receive-answer", (message) => {
      console.log(`${message.data.nickname} : `, message.data.answer);
      setMemberAnswerList((prev) => ({
        ...prev,
        [message.data.nickname]: message.data.answer,
      }));
    });

    return () => {
      receiveAnswerChannel.detach();
    };
  }, []);

  useEffect(() => {
    const checkChannel = ably.channels.get("check-nickname-channel");

    const handleCheckNickname = (message) => {
      const requestedNickname = message.data.name;
      console.log(`닉네임 확인 요청 : ${requestedNickname}`);

      // 이제 이 participants는 항상 최신 상태를 참조합니다.
      const isTaken = !!participants[requestedNickname];

      checkChannel.publish(`nickname-response-${requestedNickname}`, {
        status: isTaken ? "taken" : "ok",
      });
      console.log(
        `닉네임 응답 전송: ${requestedNickname} - ${
          isTaken ? "중복" : "사용 가능"
        }`
      );
      console.log(`현재 참가자 목록: ${JSON.stringify(participants)}`);

      if (!isTaken) {
        setParticipants((prev) => ({
          ...prev,
          [requestedNickname]: { score: 0 },
        }));
      }
    };

    // --- 1. 닉네임 중복 확인 요청에 응답하는 로직 ---
    checkChannel.subscribe("check-nickname", handleCheckNickname);

    // --- 2. Cleanup 함수 (매우 중요) ---
    // participants가 변경되어 useEffect가 다시 실행되기 전에,
    // 이전에 구독했던 콜백 함수를 반드시 해제해야 중복 구독을 막을 수 있습니다.
    return () => {
      checkChannel.unsubscribe("check-nickname", handleCheckNickname);
    };
  }, [participants]);

  return (
    <HostGameUI
      handleQuestionChange={handleQuestionChange}
      handleAnswerChange={handleAnswerChange}
      handelLimitChange={handelLimitChange}
      sendQuiz={sendQuiz}
    ></HostGameUI>
  );
}
