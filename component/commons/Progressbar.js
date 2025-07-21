"use client";

import { useState, useEffect } from "react";

// 30초를 초기값으로 설정
const TOTAL_SECONDS = 10;

export default function ProgressBar(props) {
  const [seconds, setSeconds] = useState(props.timeLimit || TOTAL_SECONDS);

  useEffect(() => {
    // 0초가 되면 타이머를 멈춥니다.
    if (seconds <= 0) {
      return;
    }

    // 1초마다 seconds 상태를 1씩 감소시킵니다.
    const timer = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds - 1);
    }, 1000);

    // 컴포넌트가 사라질 때 타이머를 정리합니다. (메모리 누수 방지)
    return () => clearInterval(timer);
  }, [seconds]);

  // 남은 시간을 퍼센트로 계산합니다.
  const progressPercentage = (seconds / props.timeLimit) * 100;

  return (
    <div style={{ width: "100%" }}>
      {/* 프로그레스바 전체 컨테이너 */}
      <div
        style={{
          height: "30px",
          width: "100%",
          backgroundColor: "#e0e0de",
          borderRadius: "50px",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        {/* 남은 시간을 표시하는 채워진 바 */}
        <div
          style={{
            height: "100%",
            width: `${progressPercentage}%`,
            backgroundColor: "#4caf50", // 초록색
            borderRadius: "inherit",
            textAlign: "right",
            transition: "width 0.2s ease-out", // 너비가 변할 때 부드러운 효과
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {/* 남은 시간 텍스트 */}
          <span
            style={{
              padding: "0 15px",
              color: "white",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {seconds != 0 && `${seconds}`}
          </span>
        </div>
      </div>
    </div>
  );
}
