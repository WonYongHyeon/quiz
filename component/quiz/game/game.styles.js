import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";

// ✅ Host 페이지와 일관된 디자인 시스템 적용
const theme = {
  colors: {
    primary: "#2563eb",
    primaryHover: "#1d4ed8",
    background: "#f3f4f6",
    surface: "#ffffff",
    textPrimary: "#111827",
    textSecondary: "#6b7280",
    border: "#d1d5db",
  },
  spacing: { md: "16px", lg: "24px", xl: "32px" },
  borderRadius: { md: "8px", lg: "16px" },
  shadows: {
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  },
  typography: { h2: "1.875rem", body: "1rem" },
};

export const GameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  padding: ${theme.spacing.lg};
  background-color: ${theme.colors.background};
`;

export const QuizWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 600px;
  min-height: 300px;
  padding: ${theme.spacing.xl};
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  text-align: center;
  gap: ${theme.spacing.lg};
`;

export const QuestionDisplay = styled.h2`
  font-size: ${theme.typography.h2};
  font-weight: bold;
  color: ${theme.colors.textPrimary};
`;

export const StatusText = styled.div`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${theme.colors.textSecondary};
`;

export const StatusTextSmall = styled.div`
  font-size: 1rem;
  color: ${theme.colors.textSecondary};
  margin-top: 24px;
`;

// ✅ 입력창과 버튼을 묶는 Wrapper 추가
export const InputWrapper = styled.div`
  display: flex;
  width: 100%;
  gap: 12px;
`;

export const QuizInput = styled.input`
  flex-grow: 1; // 남는 공간을 모두 차지
  padding: ${theme.spacing.md};
  font-size: ${theme.typography.body};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
  }
`;

export const QuizButton = styled.button`
  padding: 0 ${theme.spacing.lg};
  font-size: ${theme.typography.body};
  font-weight: bold;
  color: white;
  background-color: ${theme.colors.primary};
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: background-color 0.2s;
  &:hover {
    background-color: ${theme.colors.primaryHover};
  }
`;

export const ProgressBarContainer = styled.div`
  width: 100%;
  height: 12px;
  background-color: ${theme.colors.border};
  border-radius: 99px; // 완전히 둥글게
  overflow: hidden;
  margin: ${theme.spacing.lg} 0;
`;

const progressAnimation = keyframes`
  from { width: 100%; }
  to { width: 0%; }
`;

export const ProgressBarFill = styled.div`
  height: 100%;
  background-color: #10b981; // 퀴즈 진행중인 느낌을 주기 위해 초록색 계열로 변경
  border-radius: 99px;
  animation: ${progressAnimation} ${(props) => props.timeLimit}s linear;
  animation-fill-mode: forwards;
`;
