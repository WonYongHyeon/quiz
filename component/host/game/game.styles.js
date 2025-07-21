import styled from "@emotion/styled";

export const GameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  padding: 20px;
  box-sizing: border-box;
`;

export const QuizWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70%;
  background-color: #f3f4f6;
  padding: 20px;
  box-sizing: border-box;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

export const QuizInput = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  margin-bottom: 20px;
`;

export const QuizButton = styled.button`
  padding: 10px 20px;
  width: 100%;
  font-size: 16px;
  color: white;
  background-color: #22c55e;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background-color: #16a34a;
  }
`;
