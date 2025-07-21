"use client";

import { useEffect, useRef, useState } from "react";
import QuizGameUI from "./game.presenter";
import Ably from "ably";
import useUserStore from "@/lib/store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const ably = new Ably.Realtime({
  key: "2TTOtA.FJWgLw:xe4Vj2BJjFVo8rJ4_73BKPLEi5Rd6FHUtwx31sngmlg",
});

export default function QuizGame() {
  // 1. 스토어에서 닉네임을 가져옵니다.
  const nickname = useUserStore((state) => state.nickname);

  // 2. 클라이언트에서 렌더링이 완료되었는지 추적하는 상태를 만듭니다.
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [scoreList, setScoreList] = useState([]);
  const [answer, setAnswer] = useState("");

  const sendQuizChannelRef = useRef(null);
  const receiveAnswerChannelRef = useRef(null);
  const updateScoreChannelRef = useRef(null);

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
  };

  const sendAnswer = () => {
    if (answer.trim().length === 0) return;
    // --- ⭐️ 보내는 데이터 (객체 생성) ---
    // 전송할 데이터를 객체 형태로 만듭니다.
    const messagePayload = {
      answer,
      nickname,
      type: "object",
    };
    // 객체를 그대로 publish 합니다.
    receiveAnswerChannelRef.current.publish("receive-answer", messagePayload);
    console.log("정답 제출:", messagePayload);
    // 정답 제출 후 입력창 초기화
    setAnswer("");
  };

  useEffect(() => {
    const sendQuizChannel = ably.channels.get("send-quiz");
    const receiveAnswerChannel = ably.channels.get("receive-answer");
    const updateScoreChannel = ably.channels.get("update-score");

    sendQuizChannelRef.current = sendQuizChannel;
    updateScoreChannelRef.current = updateScoreChannel;
    receiveAnswerChannelRef.current = receiveAnswerChannel;

    // 'send-quiz' 이벤트로 들어온 객체를 구독
    sendQuizChannel.subscribe("send-quiz", (message) => {
      const { question, timeLimit } = message.data;
      setQuestion(question);
      setTimeLimit(timeLimit);
      console.log(question, timeLimit);
    });

    return () => {
      sendQuizChannel.detach();
      receiveAnswerChannel.detach();
      updateScoreChannel.detach();
    };
  }, []);

  useEffect(() => {
    let timer;
    console.log("문제:", question, "제한시간:", timeLimit);
    // 문제와 제한시간이 있을 때만 타이머 설정
    if (question != "") {
      console.log("제한시간이 설정되었습니다:", timeLimit);
      timer = setTimeout(() => {
        console.log("제한시간이 끝났습니다.");
        setQuestion(""); // 문제 리셋
      }, timeLimit * 1000); // 통신 받은 제한시간 만큼 대기

      return () => {
        if (timer) {
          clearTimeout(timer);
          console.log("이전 타이머가 클리어되었습니다.");
        }
      };
    }
  }, [question]);

  // 클라이언트에서 렌더링이 완료되었을 때만 UI를 렌더링합니다.
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // 클라이언트 환경이고, 스토어에서 가져온 닉네임이 비어있다면,
    // Hydration이 끝났음에도 닉네임이 없는 것이므로 로그인 페이지로 보냅니다.
    if (isClient && !nickname) {
      console.error("닉네임 정보가 없습니다. 다시 로그인해주세요.");
      router.push("/quiz");
    }
  }, [isClient, nickname, router]);

  return (
    <QuizGameUI
      question={question}
      timeLimit={timeLimit}
      handleAnswerChange={handleAnswerChange}
      sendAnswer={sendAnswer}
    ></QuizGameUI>
  );
}
