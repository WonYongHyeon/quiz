// lib/ably.js
import * as Ably from "ably";

// Ably API 키는 환경 변수에 저장하는 것이 좋습니다.
// 실제 키를 여기에 노출하지 마세요!
const ABLY_API_KEY =
  "BgYZqg.xeGRYA:Yv3KPXl2b7hk4LUxPiMUwsTg79BA9GTEiKlmhVGkVIY";

export const ably = new Ably.Realtime({ key: ABLY_API_KEY });

// 실시간 퀴즈에 사용할 주요 채널 이름
export const HOST_CHANNEL = "quiz:host"; // 호스트 -> 참가자 (문제, 정답 공개)
export const PARTICIPANT_CHANNEL = "quiz:participant"; // 참가자 -> 호스트 (닉네임, 정답, 질문)
export const QNA_CHANNEL = "quiz:qna"; // 질문-답변 공개 채널 (모든 참가자 구독)
