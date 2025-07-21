"use client"; // Next.js 13+ App Router 환경에서 클라이언트 컴포넌트로 명시

import { useEffect, useRef } from "react";
import Typed from "typed.js";
import styled from "@emotion/styled";

const Line = styled.div`
  width: 100%;
  height: 50px;
  font-size: 24px;
  color: #333;
  margin: 20px 0;
  text-align: center;
`;

const TypingEffect = () => {
  // 타이핑 효과를 적용할 DOM 요소를 참조하기 위해 useRef 사용
  const el = useRef(null);

  useEffect(() => {
    const options = {
      strings: ["문제를 대기중입니다...", "해블린은 돼지입니다..."], // 타이핑될 문구
      typeSpeed: 100, // 타이핑 속도
      backSpeed: 50, // 지우는 속도
      backDelay: 2000, // 2초 동안 대기 (기본값은 700ms)
      loop: true, // 무한 반복
    };

    // el.current는 span DOM 요소를 가리킵니다.
    const typed = new Typed(el.current, options);

    // 컴포넌트가 언마운트될 때 Typed 인스턴스를 파기하여 메모리 누수 방지
    return () => {
      typed.destroy();
    };
  }, []); // 빈 배열을 전달하여 컴포넌트가 마운트될 때 한 번만 실행

  return <span ref={el} />;
};

export default TypingEffect;
