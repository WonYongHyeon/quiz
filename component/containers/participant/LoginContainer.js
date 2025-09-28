// containers/participant/LoginContainer.js
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react"; // React Hooks 모두 import
import LoginPresenter from "../../presenters/participant/LoginPresenter";
import { useRouter } from "next/navigation";
import { PARTICIPANT_CHANNEL, ably } from "@/lib/ably";
import { v4 as uuidv4 } from "uuid"; // 닉네임 체크 응답을 위한 고유 ID 생성

// 🚨 보안 경고: 비밀번호는 백엔드에서 검증해야 합니다. 요청에 따라 임시로 저장합니다.
const HARDCODED_PASSWORD = "1234";

export default function LoginContainer() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const responseChannelIdRef = useRef(null); // 응답 채널 ID 저장

  useEffect(() => {
    // 1. 세션(sessionStorage) 확인
    const savedNickname = sessionStorage.getItem("quiz_nickname");
    if (savedNickname) {
      router.replace("/participant/quiz");
    }
  }, [router]);

  /**
   * 닉네임 중복 여부를 호스트에게 실시간으로 요청하고 응답을 기다리는 비동기 함수
   * @param {string} nicknameToCheck - 확인할 닉네임
   * @returns {Promise<boolean>} - 사용 가능하면 true, 중복이면 false
   */
  const checkNicknameAvailability = useCallback((nicknameToCheck) => {
    return new Promise(async (resolve, reject) => {
      // 1. 고유 응답 채널 ID 생성
      const requestId = uuidv4();
      // 요청자 전용 응답 채널 생성 (private communication)
      const responseChannel = ably.channels.get(
        `participant-response:${requestId}`
      );
      responseChannelIdRef.current = requestId;

      // 2. 응답 리스너 설정 (5초 타임아웃)
      const timeoutId = setTimeout(() => {
        responseChannel.unsubscribe();
        reject(
          new Error("호스트로부터 응답이 너무 늦거나 없습니다. (5초 초과)")
        );
      }, 5000);

      // 호스트로부터 응답을 받으면 처리
      responseChannel.subscribe("check-response", (message) => {
        clearTimeout(timeoutId);
        responseChannel.unsubscribe();
        if (message.data.available === true) {
          resolve(true); // 사용 가능
        } else {
          resolve(false); // 중복
        }
      });

      // 3. 호스트에게 닉네임 체크 요청 전송
      try {
        const channel = ably.channels.get(PARTICIPANT_CHANNEL);
        await channel.publish("nickname-check", {
          nickname: nicknameToCheck,
          responseTo: requestId, // 응답받을 채널 ID 전달
        });
      } catch (err) {
        clearTimeout(timeoutId);
        responseChannel.unsubscribe();
        reject(new Error("네트워크 오류로 닉네임 확인에 실패했습니다."));
      }
    });
  }, []);

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
      // ⭐️ 닉네임 중복 체크 실행
      const isAvailable = await checkNicknameAvailability(trimmedNickname);

      if (!isAvailable) {
        setError(
          `'${trimmedNickname}'은(는) 이미 사용 중인 닉네임입니다. 다른 닉네임을 사용해 주세요.`
        );
        setIsChecking(false);
        return;
      }

      // 2. 로그인 성공 시 처리
      sessionStorage.setItem("quiz_nickname", trimmedNickname);

      // 3. 닉네임을 호스트에게 전송 (로그인 알림)
      const channel = ably.channels.get(PARTICIPANT_CHANNEL);
      await channel.publish("new-participant", { nickname: trimmedNickname });

      router.replace("/participant/quiz");
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
