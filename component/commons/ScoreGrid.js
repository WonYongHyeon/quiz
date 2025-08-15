import styled from "@emotion/styled";
import React from "react"; // React.Fragment 사용을 위해 import

// 순위 변동을 표시하는 작은 컴포넌트
const RankChange = ({ prevRank, currentRank }) => {
  if (prevRank === -1) {
    return <StatusBadge color="#1d4ed8">New</StatusBadge>;
  }
  if (!prevRank || !currentRank) {
    return <RankIndicator color="#6b7280">-</RankIndicator>;
  }
  const diff = prevRank - currentRank;
  if (diff > 0) {
    return <RankIndicator color="#16a34a">▲ {diff}</RankIndicator>;
  }
  if (diff < 0) {
    return <RankIndicator color="#2563eb">▼ {Math.abs(diff)}</RankIndicator>;
  }
  return <RankIndicator color="#6b7280">-</RankIndicator>;
};

export default function ScoreGrid({ data }) {
  if (!data || data.length === 0) {
    return <p>참가자 순위를 기다리고 있습니다...</p>;
  }

  return (
    <GridContainer>
      {/* --- 헤더 --- */}
      <GridHeader align="center">순위</GridHeader>
      <GridHeader>닉네임</GridHeader>
      <GridHeader align="center">점수</GridHeader>
      <GridHeader align="center">변동</GridHeader>

      {/* --- 참가자 목록 --- */}
      {data.map((player) => (
        <React.Fragment key={player.nickname}>
          <GridCell align="center">{player.currentRank}위</GridCell>
          <GridCell>{player.nickname}</GridCell>
          <GridCell align="center">{player.score}점</GridCell>
          <GridCell align="center">
            <RankChange
              prevRank={player.prevRank}
              currentRank={player.currentRank}
            />
          </GridCell>
        </React.Fragment>
      ))}
    </GridContainer>
  );
}

// =================================================================
// 💅 스타일 컴포넌트
// =================================================================
const GridContainer = styled.div`
  width: 100%;
  max-width: 500px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  display: grid;
  grid-template-columns: 0.5fr 1.5fr 0.7fr 0.5fr;
`;

const GridCell = styled.div`
  padding: 16px 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: ${(props) => props.align || "left"};
  color: #374151;
  display: flex; // 셀 내용 수직 중앙 정렬을 위해 추가
  align-items: center; // 셀 내용 수직 중앙 정렬을 위해 추가
  justify-content: ${(props) =>
    props.align === "center" ? "center" : "flex-start"}; // 수평 정렬
`;

const GridHeader = styled(GridCell)`
  font-weight: bold;
  background-color: #f9fafb;
  color: #4b5563;
`;

const RankIndicator = styled.span`
  font-weight: bold;
  color: ${(props) => props.color};
`;

const StatusBadge = styled.span`
  font-size: 0.75rem;
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 99px;
  color: white;
  background-color: ${(props) => props.color};
`;
