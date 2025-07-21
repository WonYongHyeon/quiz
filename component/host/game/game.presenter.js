"use client";

import * as S from "./game.styles";
import { Toaster } from "sonner";

export default function HostGameUI(props) {
  return (
    <S.GameWrapper>
      <Toaster richColors position="top-center" />
      <S.QuizWrapper>
        <S.QuizInput
          placeholder="문제를 입력해주세요."
          onChange={props.handleQuestionChange}
        ></S.QuizInput>
        <S.QuizInput
          placeholder="정답을 입력해주세요."
          onChange={props.handleAnswerChange}
        ></S.QuizInput>
        <S.QuizInput
          placeholder="제한시간을 입력해주세요."
          onChange={props.handelLimitChange}
        ></S.QuizInput>
        <S.QuizButton onClick={props.sendQuiz}>문제 출제</S.QuizButton>
      </S.QuizWrapper>
    </S.GameWrapper>
  );
}
