"use client";

import { useEffect, useRef } from "react";
import Typed from "typed.js";
import styled from "@emotion/styled";

// ✅ keyframes는 파일 최상단에 있어도 괜찮습니다.
import { keyframes } from "@emotion/react";

const blink = keyframes`
  50% { opacity: 0; }
`;

const TypingWrapper = styled.span`
  /* ✅ 이 컴포넌트의 역할은 오직 '내부 정렬'입니다. */
  display: inline-flex;
  align-items: center;

  /* ❌ 여기서 높이를 지정할 필요가 없습니다. 부모 h1이 담당합니다. */
  /* min-height: 50px; <-- 이 줄 삭제! */

  .typed-cursor {
    /* 기존 커서는 렌더링되지 않도록 숨깁니다. */
    display: none;
  }
`;

const TypingEffect = () => {
  const el = useRef(null);

  useEffect(() => {
    const options = {
      strings: [
        "문제를 대기중입니다.",
        "해블린은 돼지입니다.",
        "디그단이 세상에서 제일 귀엽습니다.",
      ],
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000,
      loop: true,
      // ✅ 라이브러리 커서를 아예 비활성화하고, CSS로만 제어하기 위해 빈 문자열을 줍니다.
      cursorChar: " ",
    };

    const typed = new Typed(el.current, options);

    return () => {
      typed.destroy();
    };
  }, []);

  // ✅ 타이핑 효과 뒤에 우리만의 커서를 직접 추가합니다.
  return (
    <TypingWrapper>
      <span ref={el}></span>
      <Cursor />
    </TypingWrapper>
  );
};

// ✅ 깜빡이는 커서를 별도의 컴포넌트로 분리합니다.
const Cursor = styled.span`
  width: 4px;
  height: 30px;
  background-color: #111827;
  margin-left: 4px;
  animation: ${blink} 0.7s infinite;
`;

export default TypingEffect;
