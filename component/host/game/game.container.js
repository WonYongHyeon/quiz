"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import HostGameUI from "./game.presenter";
import Ably from "ably";
import { toast } from "sonner";

const ably = new Ably.Realtime({
  key: "2TTOtA.FJWgLw:xe4Vj2BJjFVo8rJ4_73BKPLEi5Rd6FHUtwx31sngmlg",
});

export default function HostGame() {
  // ✅ 퀴즈 진행에 필요한 데이터는 Ably로부터 받아 저장합니다.
  const [currentQuiz, setCurrentQuiz] = useState({
    question: "",
    timeLimit: 0,
  });
  const correctAnswerRef = useRef(""); // 정답은 ref에만 저장

  const [participants, setParticipants] = useState({});

  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isQuizInProgress, setIsQuizInProgress] = useState(false);

  const [correctNicks, setCorrectNicks] = useState([]);
  const [incorrectNicks, setIncorrectNicks] = useState([]);

  const updateScoreChannelRef = useRef(null);
  const timerRef = useRef(null);

  const clickIsCheckingAnswer = () => {
    setIsCheckingAnswer(false);
    setShowLeaderboard(false);
  };

  const handleShowLeaderboard = () => {
    setShowLeaderboard(true);
  };

  const startRound = (quizData) => {
    // Ably로부터 받은 데이터로 상태 설정
    setCurrentQuiz({
      question: quizData.question,
      timeLimit: quizData.timeLimit,
    });
    correctAnswerRef.current = quizData.correctAnswer;
    setIsQuizInProgress(true);

    setParticipants((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((nickname) => {
        if (updated[nickname].currentRank) {
          updated[nickname].prevRank = updated[nickname].currentRank;
        }
        delete updated[nickname].answer;
      });
      return updated;
    });

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setParticipants((currentParticipants) => {
        const initialCorrect = [];
        const initialIncorrect = [];
        Object.entries(currentParticipants).forEach(([nickname, data]) => {
          if (data.answer && data.answer === correctAnswerRef.current.trim()) {
            initialCorrect.push(nickname);
          } else {
            initialIncorrect.push(nickname);
          }
        });

        setCorrectNicks(initialCorrect);
        setIncorrectNicks(initialIncorrect);

        setIsQuizInProgress(false);
        setIsCheckingAnswer(true);
        setShowLeaderboard(false);

        return currentParticipants;
      });
    }, quizData.timeLimit * 1000);
  };

  // ✅ 3. dnd-kit 드래그 완료시 실행될 함수
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (!over) return; // 드롭 위치가 없으면 종료

    const draggedNick = active.id;
    const droppedContainerId = over.id; // 'correct-group' 또는 'incorrect-group'

    // 카드가 있던 원래 그룹을 찾음
    const sourceContainerId = correctNicks.includes(draggedNick)
      ? "correct-group"
      : "incorrect-group";

    // 같은 그룹 내에서 이동한 경우는 무시
    if (sourceContainerId === droppedContainerId) {
      return;
    }

    // 그룹 간 이동 처리
    if (droppedContainerId === "correct-group") {
      setIncorrectNicks((prev) => prev.filter((nick) => nick !== draggedNick));
      setCorrectNicks((prev) => [...prev, draggedNick]);
    } else {
      setCorrectNicks((prev) => prev.filter((nick) => nick !== draggedNick));
      setIncorrectNicks((prev) => [...prev, draggedNick]);
    }
  };

  // ✅ 4. '점수 확정' 버튼을 눌렀을 때 실행될 함수
  const handleFinalizeScores = () => {
    setParticipants((prev) => {
      const updatedParticipants = JSON.parse(JSON.stringify(prev));

      // 최종적으로 '정답 그룹'에 있는 사람들에게만 +1점
      correctNicks.forEach((nickname) => {
        if (updatedParticipants[nickname]) {
          updatedParticipants[nickname].score += 1;
        }
      });

      // 점수 기반으로 랭킹 재계산 (기존 로직 재활용)
      const sortedByScore = Object.entries(updatedParticipants).sort(
        ([, a], [, b]) => b.score - a.score
      );
      let lastScore = -1;
      let currentRank = 0;
      sortedByScore.forEach(([nickname], index) => {
        const participant = updatedParticipants[nickname];
        if (participant.score !== lastScore) {
          currentRank = index + 1;
        }
        participant.currentRank = currentRank;
        lastScore = participant.score;
      });

      // Ably로 최종 결과 전송
      updateScoreChannelRef.current.publish("update-score", {
        participants: updatedParticipants,
        isCheckingScore: true,
      });

      return updatedParticipants;
    });

    // 리더보드 화면으로 전환
    setShowLeaderboard(true);
  };

  // ✅ 3. Ably 채널 설정은 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    const controlChannel = ably.channels.get("quiz-control");

    const handleNewQuiz = (message) => {
      toast.info("새로운 문제가 출제되었습니다!");
      startRound(message.data);
    };

    controlChannel.subscribe("new-quiz", handleNewQuiz);

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
          return {
            ...prev,
            [requestedNickname]: {
              score: 0,
              prevRank: -1, // "신규 유저"를 의미하는 값
              currentRank: null,
            },
          };
        }
        return prev;
      });
    };

    receiveAnswerChannel.subscribe("receive-answer", handleReceiveAnswer);
    checkChannel.subscribe("check-nickname", handleCheckNickname);

    // 컴포넌트 언마운트 시 모든 구독을 해제하고 채널을 정리
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      controlChannel.unsubscribe(handleNewQuiz);
      receiveAnswerChannel.unsubscribe(handleReceiveAnswer);
      checkChannel.unsubscribe(handleCheckNickname);
    };
  }, []); // 의존성 배열을 비워서 한 번만 실행되도록 설정

  const sortedData = useMemo(() => {
    // 참가자 객체를 배열로 변환
    const participantsArray = Object.keys(participants).map((nickname) => ({
      nickname,
      ...participants[nickname],
    }));

    // [정렬 로직 1] 라운드 결과: 정답자 우선 정렬
    const roundResults = [...participantsArray].sort((a, b) => {
      const isACorrect =
        a.answer && a.answer === correctAnswerRef.current.trim();
      const isBCorrect =
        b.answer && b.answer === correctAnswerRef.current.trim();
      // isBCorrect가 true(1)이면 isACorrect가 false(0)일 때 앞으로 온다.
      return Number(isBCorrect) - Number(isACorrect);
    });

    // [정렬 로직 2] 전체 리더보드: 점수 내림차순 정렬
    const leaderboard = [...participantsArray].sort(
      (a, b) => b.score - a.score
    );

    return { roundResults, leaderboard };
  }, [participants, correctAnswerRef.current]); // participants나 correctAnswer가 바뀔 때만 재계산

  return (
    <HostGameUI
      isCheckingAnswer={isCheckingAnswer}
      clickIsCheckingAnswer={clickIsCheckingAnswer}
      showLeaderboard={showLeaderboard}
      participants={participants}
      leaderboard={sortedData.leaderboard}
      correctNicks={correctNicks}
      incorrectNicks={incorrectNicks}
      handleDragEnd={handleDragEnd}
      handleFinalizeScores={handleFinalizeScores}
      isQuizInProgress={isQuizInProgress}
      question={currentQuiz.question}
      timeLimit={currentQuiz.timeLimit}
    />
  );
}
