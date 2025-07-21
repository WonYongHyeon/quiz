"use client";

import * as S from "./quiz.styles";
import { Toaster } from "sonner";

export default function QuizUI(props) {
  return (
    <S.QuizWrapper>
      <Toaster richColors position="top-center" />
      <S.CodeInputWrapper>
        <S.NameInput
          name="name"
          placeholder="이름을 입력하세요."
          onChange={props.onChangeName}
        />
        <S.StartButton onClick={props.onClickStart}>접속하기</S.StartButton>
      </S.CodeInputWrapper>
    </S.QuizWrapper>
  );
}
