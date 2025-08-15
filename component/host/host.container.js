"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import HostUI from "./host.presenter";

export default function Host() {
  const router = useRouter();
  const [masterCode, setMasterCode] = useState("");

  const onChangeMasterCode = (event) => {
    setMasterCode(event.target.value);
  };

  const onClickStart = (path) => {
    if (masterCode === "") {
      toast.error("호스트 마스터 코드를 입력해주세요.");
      return;
    }

    if (masterCode !== "11223344") {
      toast.error("잘못된 호스트 마스터 코드입니다.");
      return;
    }

    router.push(`/host/${path}`);
  };

  return (
    <HostUI
      onClickStart={onClickStart}
      onChangeMasterCode={onChangeMasterCode}
    />
  );
}
