"use client";

import { useState } from "react";
import QuizUI from "./quiz.presenter";
import { useRouter } from "next/navigation";
import Ably from "ably";
import useUserStore from "@/lib/store";
import { toast } from "sonner";

const ably = new Ably.Realtime({
  key: "2TTOtA.FJWgLw:xe4Vj2BJjFVo8rJ4_73BKPLEi5Rd6FHUtwx31sngmlg",
});

export default function Quiz() {
  const router = useRouter();
  const [name, setName] = useState("");
  const { nickname, setNickname } = useUserStore();

  const onChangeName = (event) => {
    setName(event.target.value);
  };

  const onClickStart = async () => {
    if (name.trim().length === 0) {
      toast.error("닉네임을 입력해주세요.");
      return;
    }

    const checkChannel = ably.channels.get("check-nickname-channel");

    // 1. 응답을 처리할 함수를 미리 정의합니다.
    const handleNicknameResponse = (message) => {
      console.log("asd");
      // 3. 호스트로부터 응답을 받습니다.
      if (message.data.status === "ok") {
        // 성공!
        console.log(`닉네임 사용 가능: ${name}`);
        setNickname(name);
        router.push("/quiz/game");
      } else {
        // 실패!
        toast.error("이미 사용 중인 닉네임입니다.");
      }

      // 4. 로딩 상태를 풀고, 응답을 받았으므로 자기 자신을 구독 해제합니다.
      checkChannel.unsubscribe(
        `nickname-response-${name}`,
        handleNicknameResponse
      );
    };

    // 미리 정의한 함수로 응답을 '구독'합니다.
    checkChannel.subscribe(`nickname-response-${name}`, handleNicknameResponse);

    // 호스트에게 닉네임 사용 가능 여부를 '발행'하여 물어봅니다.
    console.log(`[참가자] 닉네임 확인 요청 보냄: ${name}`);
    checkChannel.publish("check-nickname", { name: name });
  };

  return (
    <QuizUI onClickStart={onClickStart} onChangeName={onChangeName}></QuizUI>
  );
}
