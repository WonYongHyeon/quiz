import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";

// =================================================================
// 🎨 디자인 테마: 색상, 폰트, 간격 등을 중앙에서 관리합니다.
// =================================================================
const theme = {
  colors: {
    primary: "#2563eb", // 주요 색상 (버튼, 하이라이트 등)
    primaryHover: "#1d4ed8",
    secondary: "#10b981", // 보조 색상 (프로그레스 바 등)
    background: "#f3f4f6", // 페이지 배경
    surface: "#ffffff", // 카드, 입력창 등 표면
    textPrimary: "#111827", // 주요 텍스트
    textSecondary: "#6b7280", // 보조 텍스트
    border: "#d1d5db", // 테두리
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },
  shadows: {
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
  },
  borderRadius: {
    md: "8px",
    lg: "16px",
  },
  typography: {
    h1: "2.25rem", // 36px
    h2: "1.875rem", // 30px
    body: "1rem", // 16px
  },
};

// =================================================================
// 💅 스타일 컴포넌트
// =================================================================

// --- 페이지 레벨 컨테이너 ---

export const GameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 100vh;
  gap: ${theme.spacing.lg};
  padding: ${theme.spacing.lg};
  background-color: ${theme.colors.background};
  box-sizing: border-box;
`;

export const LeaderboardWrapper = styled(GameWrapper)``; // GameWrapper 스타일 재사용

// --- 카드 형태의 컨테이너 ---

const CardBase = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 600px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.xl};
  background-color: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.shadows.md};
  text-align: center;
`;

export const QuizWrapper = styled(CardBase)``; // CardBase 스타일 재사용
export const InProgressWrapper = styled(CardBase)`
  min-height: 200px;
  justify-content: center;

  h1 {
    /* h1 블록 자체의 높이를 고정합니다. */
    min-height: 50px;

    /* 내부의 TypingWrapper(span)를 수직/수평 중앙에 배치합니다. */
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

// --- 개별 UI 요소 ---

export const QuestionDisplay = styled.h2`
  font-size: ${theme.typography.h2};
  font-weight: bold;
  margin: ${theme.spacing.md} 0;
  color: ${theme.colors.textPrimary};
`;

export const QuizInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  font-size: ${theme.typography.body};
  color: ${theme.colors.textPrimary};
  background-color: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  transition: border-color 0.2s, box-shadow 0.2s;

  &::placeholder {
    color: ${theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2); // 포커스 시 테두리 효과
  }
`;

export const QuizButton = styled.button`
  /* width: 100%; */
  padding: ${theme.spacing.md};
  font-size: ${theme.typography.body};
  font-weight: bold;
  color: white;
  background-color: ${theme.colors.primary};
  border: none;
  border-radius: ${theme.borderRadius.md};
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;

  &:hover {
    background-color: ${theme.colors.primaryHover};
  }

  &:active {
    transform: scale(0.98); // 클릭 시 살짝 작아지는 효과
  }
`;

// --- 프로그레스 바 ---

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
  background-color: ${theme.colors.secondary};
  border-radius: 99px;
  animation: ${progressAnimation} ${(props) => props.timeLimit}s linear;
  animation-fill-mode: forwards;
`;
