"use client";

import ProgressBar from "../../commons/Progressbar";
import ScoreGrid from "../../commons/ScoreGrid"; // Host와 동일한 ScoreGrid 재사용
import * as S from "./game.styles";
import { Toaster } from "sonner";

export default function QuizGameUI(props) {
  const renderContent = () => {
    switch (props.gameState) {
      // ✅ 'in-progress' 상태: 문제와 입력창 표시
      case "in-progress":
        return (
          <>
            <S.QuestionDisplay>{props.question}</S.QuestionDisplay>
            {/* ✅ 기존 ProgressBar 컴포넌트를 새로운 스타일 컴포넌트로 교체 */}
            <S.ProgressBarContainer>
              <S.ProgressBarFill timeLimit={props.timeLimit} />
            </S.ProgressBarContainer>
            <S.InputWrapper>
              <S.QuizInput
                value={props.answer}
                placeholder="정답을 입력해주세요."
                onChange={props.handleAnswerChange}
                onKeyUp={(e) => e.key === "Enter" && props.sendAnswer()}
              />
              <S.QuizButton onClick={props.sendAnswer}>정답 제출</S.QuizButton>
            </S.InputWrapper>
          </>
        );
      // ✅ 'results' 상태: 결과(ScoreGrid) 표시
      case "results":
        return (
          <>
            <S.StatusText>🏆 최종 순위</S.StatusText>
            <ScoreGrid data={props.scoreData} />
            <S.StatusTextSmall>다음 문제를 기다려주세요...</S.StatusTextSmall>
          </>
        );
      // ✅ 'waiting' 상태: 대기 메시지 표시
      case "waiting":
      default:
        return <S.StatusText>대기중...</S.StatusText>;
    }
  };

  return (
    <S.GameWrapper>
      <Toaster richColors position="top-center" />
      <S.QuizWrapper>{renderContent()}</S.QuizWrapper>
    </S.GameWrapper>
  );
}
