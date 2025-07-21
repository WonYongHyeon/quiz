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
        <S.StartButton onClick={props.onClickStart}>접속하기</S.StartButton>
      </S.CodeInputWrapper>
    </S.HostWrapper>
  );
}
