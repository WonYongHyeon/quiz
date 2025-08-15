"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import Ably from "ably";
import { toast, Toaster } from "sonner";

// Ably 클라이언트는 두 페이지에서 모두 필요합니다.
const ably = new Ably.Realtime({
  key: "2TTOtA.FJWgLw:xe4Vj2BJjFVo8rJ4_73BKPLEi5Rd6FHUtwx31sngmlg",
});

export default function HostSetupPage() {
  const [question, setQuestion] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [timeLimit, setTimeLimit] = useState(10); // 기본값 10초

  const sendQuiz = () => {
    if (
      question.trim().length === 0 ||
      correctAnswer.trim().length === 0 ||
      timeLimit <= 0
    ) {
      toast.error("문제, 정답, 제한시간을 모두 올바르게 입력해주세요.");
      return;
    }

    const quizData = { question, correctAnswer, timeLimit };

    // 'quiz-control' 채널에 'new-quiz'라는 이름으로 문제 데이터를 발행합니다.
    ably.channels.get("quiz-control").publish("new-quiz", quizData);

    toast.success("문제가 성공적으로 출제되었습니다!");
    // 입력창 초기화
    setQuestion("");
    setCorrectAnswer("");
  };

  return (
    <Wrapper>
      <Toaster richColors position="top-center" />
      <FormContainer>
        <h1>퀴즈 문제 출제</h1>
        <p>이곳에서 문제를 출제하면 방송 화면에 실시간으로 반영됩니다.</p>
        <Input
          value={question}
          placeholder="문제를 입력해주세요."
          onChange={(e) => setQuestion(e.target.value)}
        />
        <Input
          value={correctAnswer}
          placeholder="정답을 입력해주세요."
          onChange={(e) => setCorrectAnswer(e.target.value)}
        />
        <Input
          type="number"
          value={timeLimit}
          placeholder="제한시간(초)을 입력해주세요."
          onChange={(e) => setTimeLimit(Number(e.target.value))}
        />
        <Button onClick={sendQuiz}>문제 출제하기</Button>
      </FormContainer>
    </Wrapper>
  );
}

// 간단한 스타일링
const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f3f4f6;
`;
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 500px;
  padding: 32px;
  background: white;
  gap: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;
const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
`;
const Button = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  background-color: #2563eb;
  color: white;
  border-radius: 8px;
  cursor: pointer;
`;
