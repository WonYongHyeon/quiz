"use client";

import MainUI from "./main.presenter";
import { useRouter } from "next/navigation";

export default function Main() {
  const router = useRouter();

  const onClickHost = () => {
    // Navigate to host page
    router.push(`/host`);
  };
  const onClickQuiz = () => {
    // Navigate to guest page
    router.push(`/quiz`);
  };
  return <MainUI onClickHost={onClickHost} onClickQuiz={onClickQuiz} />;
}
