"use client";

import * as S from "./main.styles";

export default function MainUI(props) {
  return (
    <S.MainWrapper>
      <S.HostMoveButton onClick={props.onClickHost}>
        호스트로 참여
      </S.HostMoveButton>
      <S.GuestMoveButton onClick={props.onClickQuiz}>
        게스트로 참여
      </S.GuestMoveButton>
    </S.MainWrapper>
  );
}
