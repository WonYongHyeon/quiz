"use client";

import ProgressBar from "../../commons/Progressbar";
import TypingEffect from "../../commons/TypingEffect";
import * as S from "./game.styles";
import { Toaster } from "sonner";

export default function QuizGameUI(props) {
  return (
    <S.GameWrapper>
      <Toaster richColors position="top-center" />
      <S.QuizWrapper>
        <S.TypingEffectWrapper>
          {props.question ? <>{props.question}</> : <TypingEffect />}
        </S.TypingEffectWrapper>
        {props.question && <ProgressBar timeLimit={props.timeLimit} />}
        <S.QuizInput
          placeholder="정답을 입력해주세요."
          onChange={props.handleAnswerChange}
        ></S.QuizInput>
        <S.QuizButton onClick={props.sendAnswer}>정답 제출</S.QuizButton>
      </S.QuizWrapper>
    </S.GameWrapper>
  );
}
