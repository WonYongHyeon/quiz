"use client";

import { useState, useEffect, useRef } from "react";

export default function ProgressBar(props) {
  // 목표 종료 시각을 저장하기 위해 ref를 사용합니다.
  // 이렇게 하면 인터벌 콜백 함수 안에서 최신 상태를 참조할 수 있습니다.
  const endTimeRef = useRef(null);
  const [seconds, setSeconds] = useState(props.timeLimit);

  useEffect(() => {
    // props.timeLimit이 변경되면 새로운 문제가 출제된 것입니다.
    // 현재 시각에 props로 받은 제한 시간을 더해 새로운 목표 종료 시각을 설정합니다.
    endTimeRef.current = new Date().getTime() + props.timeLimit * 1000;

    // 화면에 보이는 시간(초) 상태도 새로운 전체 시간으로 리셋합니다.
    setSeconds(props.timeLimit);

    const timer = setInterval(() => {
      // 인터벌이 실행될 때마다 남은 시간을 새로 계산합니다.
      const now = new Date().getTime();
      const timeLeft = Math.round((endTimeRef.current - now) / 1000);

      if (timeLeft <= 0) {
        setSeconds(0);
        clearInterval(timer);
      } else {
        setSeconds(timeLeft);
      }
    }, 1000); // UI 업데이트를 위해 여전히 1초마다 실행하려고 시도합니다.

    // 컴포넌트가 언마운트되거나 props.timeLimit이 변경될 때 인터벌을 정리합니다.
    return () => clearInterval(timer);
  }, [props.timeLimit]); // 이 effect는 props.timeLimit이 바뀔 때마다 재실행됩니다.

  // 진행률(%)은 항상 원래의 전체 제한 시간(props.timeLimit)을 기준으로 계산합니다.
  const progressPercentage = (seconds / props.timeLimit) * 100;

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          height: "30px",
          width: "100%",
          backgroundColor: "#e0e0de",
          borderRadius: "50px",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercentage}%`,
            backgroundColor: "#4caf50",
            borderRadius: "inherit",
            textAlign: "right",
            transition: "width 0.2s ease-out",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <span
            style={{
              padding: "0 15px",
              color: "white",
              fontWeight: "bold",
              fontSize: "1rem",
            }}
          >
            {/* 0초일 때는 숫자를 표시하지 않습니다. */}
            {seconds > 0 && `${seconds}`}
          </span>
        </div>
      </div>
    </div>
  );
}
