// containers/MainContainer.js
"use client";

import MainPresenter from "../presenters/MainPresenter";
import { useRouter } from "next/navigation";

export default function MainContainer() {
  const router = useRouter();

  const handleHostClick = () => {
    router.push("/host");
  };

  const handleParticipantClick = () => {
    router.push("/participant/login");
  };

  return (
    <MainPresenter
      onHostClick={handleHostClick}
      onParticipantClick={handleParticipantClick}
    />
  );
}
