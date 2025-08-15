"use client";

import ScoreGrid from "../../commons/ScoreGrid";
import * as S from "./game.styles";
import { Toaster } from "sonner";
import { DndContext } from "@dnd-kit/core";
// ✅ 1. 오타 수정
import DroppableContainer from "../../commons/DroppableContainer";
import TypingEffect from "../../commons/TypingEffect";

export default function HostGameUI(props) {
  // --- 수동 채점 화면 ---
  if (props.isCheckingAnswer && !props.showLeaderboard) {
    return (
      <S.GameWrapper>
        <DndContext onDragEnd={props.handleDragEnd}>
          <h1 style={{ textAlign: "center" }}>
            채점 보드 (드래그하여 정답/오답을 조정하세요)
          </h1>
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: "20px",
              padding: "0 20px",
            }}
          >
            <DroppableContainer
              id="correct-group"
              title="✅ 정답 그룹"
              nicks={props.correctNicks}
              allParticipants={props.participants}
            />
            <DroppableContainer
              id="incorrect-group"
              title="❌ 오답 그룹"
              nicks={props.incorrectNicks}
              allParticipants={props.participants}
            />
          </div>
          <S.QuizButton
            onClick={props.handleFinalizeScores}
            style={{ marginTop: "20px", width: "auto", padding: "10px 20px" }}
          >
            이대로 점수 확정하기
          </S.QuizButton>
        </DndContext>
      </S.GameWrapper>
    );
  }
  // --- 최종 리더보드 화면 ---
  else if (props.isCheckingAnswer && props.showLeaderboard) {
    return (
      <S.LeaderboardWrapper>
        <h1>🏆 최종 순위</h1>
        {/* ✅ 2. ScoreGrid에 leaderboard 데이터만 전달하여 단순화 */}
        <ScoreGrid data={props.leaderboard} />
        {/* ✅ 3. 버튼 텍스트를 더 명확하게 변경 */}
        <S.QuizButton onClick={props.clickIsCheckingAnswer}>
          다음 문제
        </S.QuizButton>
      </S.LeaderboardWrapper>
    );
  } else if (props.isQuizInProgress) {
    return (
      <S.GameWrapper>
        <S.InProgressWrapper>
          <h2>문제가 출제되었습니다!</h2>
          <S.QuestionDisplay>{props.question}</S.QuestionDisplay>
          <S.ProgressBarContainer>
            <S.ProgressBarFill timeLimit={props.timeLimit} />
          </S.ProgressBarContainer>
          <p>{props.timeLimit}초 안에 정답을 제출하세요!</p>
        </S.InProgressWrapper>
      </S.GameWrapper>
    );
  }
  // --- 문제 출제 화면 ---
  else {
    return (
      <S.GameWrapper>
        <Toaster richColors position="top-center" />
        <S.InProgressWrapper>
          <h1>
            <TypingEffect />
          </h1>
          <p>문제 출제 페이지에서 다음 문제를 출제해주세요.</p>
        </S.InProgressWrapper>
      </S.GameWrapper>
    );
  }
}
