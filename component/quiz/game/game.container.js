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
  const nickname = useUserStore((state) => state.nickname);
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ 1. 게임 상태를 명확히 관리하는 state 추가
  const [gameState, setGameState] = useState("waiting"); // waiting, in-progress, results
  const [question, setQuestion] = useState("");
  const [timeLimit, setTimeLimit] = useState(0);
  const [answer, setAnswer] = useState("");
  const [scoreData, setScoreData] = useState(null); // 점수 결과 데이터

  const receiveAnswerChannelRef = useRef(null);

  const handleAnswerChange = (e) => {
    setAnswer(e.target.value);
  };

  const sendAnswer = () => {
    // 문제를 푸는 중일 때만 정답 제출 가능
    if (gameState !== "in-progress" || answer.trim().length === 0) return;

    receiveAnswerChannelRef.current.publish("receive-answer", {
      answer,
      nickname,
    });
    setAnswer("");
    toast.success("정답을 제출했습니다!");
  };

  useEffect(() => {
    const quizControlChannel = ably.channels.get("quiz-control"); // Host와 동일한 채널 사용
    const updateScoreChannel = ably.channels.get("update-score");
    receiveAnswerChannelRef.current = ably.channels.get("receive-answer");

    // 새 문제가 출제되면 'in-progress' 상태로 변경
    const handleNewQuiz = (message) => {
      const { question, timeLimit } = message.data;
      setQuestion(question);
      setTimeLimit(timeLimit);
      setGameState("in-progress");
      setScoreData(null); // 이전 결과 데이터 초기화
    };

    // 점수 업데이트가 오면 'results' 상태로 변경
    const handleUpdateScore = (message) => {
      // ✅ 닉네임이 포함되도록 데이터 가공
      const participantsObject = message.data.participants;
      const participantsArray = Object.keys(participantsObject)
        .map((nickname) => ({
          nickname,
          ...participantsObject[nickname],
        }))
        .sort((a, b) => a.currentRank - b.currentRank);
      setScoreData(participantsArray);
      setGameState("results");
    };
    const handleNextRound = () => {
      toast("다음 라운드가 곧 시작됩니다!");
      setGameState("waiting");
      setScoreData(null); // 이전 순위 데이터 초기화
    };

    quizControlChannel.subscribe("new-quiz", handleNewQuiz);
    updateScoreChannel.subscribe("update-score", handleUpdateScore);
    quizControlChannel.subscribe("request-new-quiz", handleNextRound);

    return () => {
      quizControlChannel.unsubscribe(handleNewQuiz);
      updateScoreChannel.unsubscribe(handleUpdateScore);
      quizControlChannel.unsubscribe("request-new-quiz", handleNextRound);
    };
  }, []);

  useEffect(() => {
    // 'in-progress' 상태일 때만 타이머를 설정
    if (gameState === "in-progress") {
      const timer = setTimeout(() => {
        // 시간이 다 되면 'waiting' 상태로 돌아가 다음 문제를 기다림
        setGameState("waiting");
        setQuestion(""); // 문제 리셋
        toast.info("시간 종료! 다음 문제를 기다려주세요.");
      }, timeLimit * 1000);

      return () => clearTimeout(timer);
    }
  }, [gameState, timeLimit]);

  useEffect(() => {
    // hasHydrated()는 동기적으로 현재 상태를 반환하므로,
    // 이펙트 훅 안에서 사용하면 안전하게 상태를 확인할 수 있습니다.
    setIsHydrated(useUserStore.persist.hasHydrated());
  }, []);

  useEffect(() => {
    // isHydrated가 true가 된 이후에만 닉네임 유무를 판단합니다.
    if (isHydrated && !nickname) {
      console.error("닉네임 정보가 없습니다. 다시 로그인해주세요.");
      router.push("/quiz");
    }
  }, [isHydrated, nickname, router]);

  return (
    <QuizGameUI
      gameState={gameState}
      question={question}
      timeLimit={timeLimit}
      answer={answer}
      handleAnswerChange={handleAnswerChange}
      sendAnswer={sendAnswer}
      scoreData={scoreData} // 결과 화면에 점수 데이터 전달
    />
  );
}
