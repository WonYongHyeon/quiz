import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// 사용자 정보를 저장할 스토어 생성
const useUserStore = create(
  persist(
    (set) => ({
      nickname: "", // 닉네임을 저장할 공간
      setNickname: (newNickname) => set({ nickname: newNickname }), // 닉네임을 변경하는 함수
    }),
    {
      // localStorage에 저장될 때 사용될 이름(key)을 지정합니다.
      name: "user-nickname-session-storage",
      // 스토어의 데이터를 JSON 형태로 저장하기 위해 JSONStorage를 사용합니다.
      // 사용할 저장소를 sessionStorage로 직접 지정해줍니다.
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useUserStore;
