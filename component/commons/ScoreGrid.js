import styled from "@emotion/styled";

const ScoreGrid = ({ data }) => {
  // data 객체를 [key, value] 형태의 배열로 변환합니다.
  const dataArray = Object.entries(data);
  console.log("ScoreGrid dataArray:", dataArray);

  return (
    // 이 div가 카드들을 감싸는 그리드 컨테이너가 됩니다.
    // className은 아래 스타일링 방법 중 선택하여 적용합니다.
    <GridContainer>
      {dataArray.map(([id, value]) => (
        <Card key={id}>
          <h2>ID: {id}</h2>
          <p>Answer: {value.answer}</p>
          <p>Score: {value.score}</p>
        </Card>
      ))}
    </GridContainer>
  );
};

export default ScoreGrid;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  padding: 1rem;
  box-sizing: border-box;
`;

const Card = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: white;
`;
