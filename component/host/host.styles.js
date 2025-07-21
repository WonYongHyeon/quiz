import styled from "@emotion/styled";

export const HostWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f3f4f6;
`;

export const CodeInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 50px;
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
  padding: 50px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: auto;
`;

export const MasterCodeInput = styled.input`
  width: 300px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
`;

export const QuizRoomCodeInput = styled.input`
  width: 300px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
`;

export const StartButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: #4f46e5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  &:hover {
    background-color: #4338ca;
    scale: 1.05;
  }
  &:disabled {
    background-color: #9ca3af;
    cursor: not-allowed;
  }
`;
