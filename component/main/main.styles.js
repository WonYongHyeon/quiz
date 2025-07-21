import styled from "@emotion/styled";

export const MainWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 50px;
  margin: auto;
  height: 100vh;
`;

export const HostMoveButton = styled.button`
  padding: 10px 20px;
  font-size: 40px;
  width: 300px;
  height: 200px;
  color: white;
  background-color: #4f46e5;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #4338ca;
    scale: 1.05;
  }
`;

export const GuestMoveButton = styled.button`
  padding: 10px 20px;
  font-size: 40px;
  width: 300px;
  height: 200px;
  color: white;
  background-color: #22c55e;
  border-radius: 20px;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #16a34a;
    scale: 1.05;
  }
`;
