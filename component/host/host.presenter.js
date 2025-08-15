"use client";

import * as S from "./host.styles";
import { Toaster } from "sonner";

export default function HostUI(props) {
  return (
    <S.HostWrapper>
      <Toaster richColors position="top-center" />
      <S.CodeInputWrapper>
        <S.MasterCodeInput
          type="password"
          placeholder="호스트 마스터 코드를 입력하세요."
          onChange={props.onChangeMasterCode}
        />
        <S.StartButton onClick={() => props.onClickStart("set-questions")}>
          문제 출제 화면 접속하기
        </S.StartButton>
        <S.StartButton onClick={() => props.onClickStart("game")}>
          방송용 화면 접속하기
        </S.StartButton>
      </S.CodeInputWrapper>
    </S.HostWrapper>
  );
}
