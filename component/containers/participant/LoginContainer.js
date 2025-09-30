// containers/participant/LoginContainer.js
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react"; // React Hooks 모두 import
import LoginPresenter from "../../presenters/participant/LoginPresenter";
import { useRouter } from "next/navigation";
import { PARTICIPANT_CHANNEL, ably } from "@/lib/ably";
import { v4 as uuidv4 } from "uuid"; // 닉네임 체크 응답을 위한 고유 ID 생성
import FingerprintJS from "@fingerprintjs/fingerprintjs";

// 🚨 보안 경고: 비밀번호는 백엔드에서 검증해야 합니다. 요청에 따라 임시로 저장합니다.
const HARDCODED_PASSWORD = "1226";

export default function LoginContainer() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const responseChannelIdRef = useRef(null); // 응답 채널 ID 저장

  useEffect(() => {
    const loadFingerprint = async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setDeviceId(result.visitorId); // 고유 ID 설정
    };
    loadFingerprint();
  }, []);

  useEffect(() => {
    // 1. 세션(sessionStorage) 확인
    const savedNickname = sessionStorage.getItem("quiz_nickname");
    if (savedNickname) {
      router.replace("/participant/quiz");
    }
  }, [router]);

  useEffect(() => {
    if (!deviceId) return;
    console.log("deviceId changed:", deviceId);

    // const responseChannel = ably.channels.get(`login-response:${deviceId}`);
    const channel = ably.channels.get(PARTICIPANT_CHANNEL);

    const handleLoginResponse = (message) => {
      console.log("Received login response:", message.data);
      if (message.data.checked) {
        console.log("로그인 승인됨:", message.data);
        console.log("deviceId:", deviceId);
        console.log("nickname:", nickname);

        sessionStorage.setItem("current_device_id", deviceId);
        sessionStorage.setItem("quiz_nickname", message.data.nickname);
        router.replace("/participant/quiz");
        return;
      } else {
        console.log(message.data.reason);
        setError(message.data.reason || "로그인이 거부되었습니다.");
        setIsChecking(false);
      }
    };

    channel.subscribe(`login-response:${deviceId}`, handleLoginResponse);

    return () => {
      channel.unsubscribe();
    };
  }, [deviceId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== HARDCODED_PASSWORD) {
      setError("올바르지 않은 패스워드입니다.");
      return;
    }

    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError("닉네임을 입력해주세요.");
      return;
    }

    setIsChecking(true);

    try {
      // 닉네임을 호스트에게 전송 (로그인 알림)
      const channel = ably.channels.get(PARTICIPANT_CHANNEL);
      await channel.publish("new-participant", {
        nickname: trimmedNickname,
        deviceId,
      });
    } catch (err) {
      setError(err.message || "로그인 처리 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <LoginPresenter
      nickname={nickname}
      password={password}
      onNicknameChange={setNickname}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      error={error}
      isChecking={isChecking}
    />
  );
}
