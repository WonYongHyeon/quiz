// containers/host/HostContainer.js (수정된 전체 코드)
"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import HostPresenter from "../../presenters/host/HostPresenter";
import HostLogin from "./HostLogin";
import {
  HOST_CHANNEL,
  PARTICIPANT_CHANNEL,
  QNA_CHANNEL,
  ably,
} from "@/lib/ably";
import { v4 as uuidv4 } from "uuid";
import Swal from "sweetalert2";
import ParticipantKickModal from "../../presenters/host/ParticipantKickModal";

// sessionStorage 키 정의
const PARTICIPANTS_KEY = "host_participants";
const INPUTS_KEY = "host_inputs";
const QUIZ_KEY = "host_current_quiz";
const AUTH_KEY = "host_authenticated";

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [bannedDeviceIds, setBannedDeviceIds] = useState([]);

  // 2. 무한 루프 방지를 위해 participants의 최신 값을 참조할 Ref 사용
  const participantsRef = useRef(participants);
  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  // 3. ⭐️ 초기 데이터 로드 및 Ably 구독 설정 (두 개의 useEffect를 통합)
  useEffect(() => {
    let participantChannel;
    let newParticipantHandler, participantInputHandler;

    if (typeof window !== "undefined" && !isLoaded) {
      // a. 데이터 로드 및 상태 설정 (Hydration 오류 방지)
      try {
        setCurrentQuiz(JSON.parse(sessionStorage.getItem(QUIZ_KEY) || '""'));
        setParticipants(
          JSON.parse(sessionStorage.getItem(PARTICIPANTS_KEY) || "[]")
        );
        setInputs(JSON.parse(sessionStorage.getItem(INPUTS_KEY) || "[]"));
        // ⭐️ 인증 상태 로드 (setState는 한 번만 실행되도록 보장)
        setIsAuthenticated(sessionStorage.getItem(AUTH_KEY) === "true");
      } catch (e) {
        console.error("Failed to load state from sessionStorage:", e);
      }
      setIsLoaded(true);
    }

    // b. Ably 채널 구독 (isAuthenticated 상태가 true일 때만 구독을 시작합니다.)
    if (isAuthenticated) {
      participantChannel = ably.channels.get(PARTICIPANT_CHANNEL);

      // 새 참가자 등록
      newParticipantHandler = (message) => {
        const { nickname, deviceId } = message.data;
        console.log("새 참가자 요청:", message.data);

        const bannedDeviceIds =
          JSON.parse(sessionStorage.getItem("banned_device_ids")) || [];

        // 강퇴된 디바이스 ID인지 확인
        if (bannedDeviceIds.includes(deviceId)) {
          console.log(`강퇴된 디바이스 ID의 접속 시도: ${deviceId}`);
          const channel = ably.channels.get(PARTICIPANT_CHANNEL);
          channel.publish(`login-response:${deviceId}`, {
            checked: false,
            reason: "강퇴된 참가자입니다. 접속이 거부되었습니다.",
            nickname,
            deviceId,
          });
          return; // 이후 로직 실행 방지
        }

        // 디바이스 ID 중복 확인
        if (participantsRef.current.some((p) => p.deviceId === deviceId)) {
          console.log(`중복된 디바이스 ID: ${deviceId}`);
          const channel = ably.channels.get(PARTICIPANT_CHANNEL);
          channel.publish(`login-response:${deviceId}`, {
            checked: false,
            reason: "중복된 디바이스 ID로 접속이 거부되었습니다.",
            nickname,
            deviceId,
          });
          return; // 이후 로직 실행 방지
        }

        // 닉네임 중복 확인
        if (participantsRef.current.some((p) => p.nickname === nickname)) {
          console.log(`중복된 닉네임: ${nickname}`);
          const channel = ably.channels.get(PARTICIPANT_CHANNEL);
          channel.publish(`login-response:${deviceId}`, {
            checked: false,
            reason: "중복된 닉네임으로 접속이 거부되었습니다.",
            nickname,
            deviceId,
          });
          return; // 이후 로직 실행 방지
        }

        // 새로운 참가자 추가
        const newParticipant = { nickname, deviceId };
        setParticipants((prev) => {
          const updated = [...prev, newParticipant];
          console.log("참가자 추가: ", updated); // 디버깅 로그 추가
          sessionStorage.setItem(PARTICIPANTS_KEY, JSON.stringify(updated));
          return updated;
        });

        const channel = ably.channels.get(PARTICIPANT_CHANNEL);
        channel.publish(`login-response:${deviceId}`, {
          checked: true,
          message: "로그인이 허용되었습니다.",
          nickname,
          deviceId,
        });
      };
      participantChannel.subscribe("new-participant", newParticipantHandler);

      // 참가자 입력(질문/정답) 받기 핸들러
      participantInputHandler = (message) => {
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
      participantChannel.subscribe(
        "participant-input",
        participantInputHandler
      );
    }

    return () => {
      // 컴포넌트 언마운트 시 또는 isAuthenticated 변경 시 구독 해제
      if (participantChannel) {
        participantChannel.unsubscribe(
          "new-participant",
          newParticipantHandler
        );
        participantChannel.unsubscribe(
          "participant-input",
          participantInputHandler
        );
      }
    };
  }, [isAuthenticated, isLoaded]); // ⭐️ isLoaded는 Hydration 문제 방지용, isAuthenticated는 인증 시 구독 시작용

  // 4. 상태 변경 시 sessionStorage에 저장
  useEffect(() => {
    if (isLoaded) saveState(QUIZ_KEY, currentQuiz);
  }, [currentQuiz, isLoaded]);

  useEffect(() => {
    if (isLoaded) saveState(PARTICIPANTS_KEY, participants);
  }, [participants, isLoaded]);

  useEffect(() => {
    if (isLoaded) saveState(INPUTS_KEY, inputs);
  }, [inputs, isLoaded]);

  // ⭐️ 인증 상태 변경 시 sessionStorage에 저장
  useEffect(() => {
    if (isLoaded) sessionStorage.setItem(AUTH_KEY, isAuthenticated.toString());
  }, [isAuthenticated, isLoaded]);

  // ⭐️ 로그인 핸들러: 깜빡임 방지를 위해 상태 업데이트를 먼저 처리
  const handleLogin = (success) => {
    if (success) {
      // 1. 먼저 인증 상태를 즉시 업데이트
      setIsAuthenticated(true);

      // 2. SweetAlert2 알림을 띄웁니다.
      Swal.fire({
        title: "접속 성공!",
        text: "호스트 콘솔에 접근했습니다.",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });
    }
  };

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
                processedAt: Date.now(),
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
                processedAt: Date.now(),
              }
            : input
        )
      );

      const feedbackData = {
        type: "feedback",
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

        // 2) QNA_CHANNEL에 피드백 전송 (모두에게 공유되는 공개 기록용)
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

  // 9. 참가자 강퇴 핸들러
  const handleKickParticipant = (deviceId) => {
    // 밴 아이디 리스트에 추가
    setBannedDeviceIds((prev) => {
      const updatedBannedList = [...prev, deviceId];
      sessionStorage.setItem(
        "banned_device_ids",
        JSON.stringify(updatedBannedList)
      );
      console.log(updatedBannedList);
      return updatedBannedList;
    });

    // 참가자 리스트에서 해당 디바이스 ID를 가진 참가자 삭제
    setParticipants((prevParticipants) =>
      prevParticipants.filter(
        (participant) => participant.deviceId !== deviceId
      )
    );
    sessionStorage.setItem(
      PARTICIPANTS_KEY,
      JSON.stringify(
        participants.filter((participant) => participant.deviceId !== deviceId)
      )
    );

    // 강퇴된 참가자에게 알림 및 로그인 화면으로 이동
    const channel = ably.channels.get(PARTICIPANT_CHANNEL);
    channel.publish(`participant-kicked:${deviceId}`, {
      kick: true,
    });
  };

  // 10. Hydration 완료 전에는 로딩 UI 반환
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

  // ⭐️ 인증되지 않았다면 로그인 컴포넌트를 렌더링합니다.
  if (!isAuthenticated) {
    return <HostLogin onLogin={handleLogin} />;
  }

  // 11. Presenter에 전달할 데이터 준비 (인증 성공 시만 실행)
  const questions = inputs.filter(
    (i) => i.type === "question" && !i.hostAnswer
  );
  const answers = inputs.filter(
    (i) => i.type === "answer" && i.isCorrect === null
  );

  // ⭐️ 처리된 기록(리스트) 필터링 및 정렬
  const rawProcessedList = inputs.filter(
    (i) =>
      (i.type === "question" && i.hostAnswer) ||
      (i.type === "answer" && i.isCorrect !== null)
  );

  const processedList = rawProcessedList.sort(
    (a, b) => a.processedAt - b.processedAt
  );

  const onKickModalOpen = () => {
    setIsKickModalOpen(true);
  };

  return (
    <>
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
        onKickModalOpen={onKickModalOpen} // Pass the function to HostPresenter
      />

      {isKickModalOpen && (
        <ParticipantKickModal
          participants={participants}
          onClose={() => setIsKickModalOpen(false)}
          onKick={handleKickParticipant}
        />
      )}
    </>
  );
}
