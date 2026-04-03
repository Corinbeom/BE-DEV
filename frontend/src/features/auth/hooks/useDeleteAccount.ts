import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAccount } from "../api/authApi";
import { useAuth } from "./useAuth";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: (memberId: number) => deleteAccount(memberId),
    onSuccess: async () => {
      alert("정상적으로 탈퇴되었습니다. 그동안 이용해 주셔서 감사합니다.");
      // 프론트엔드의 세션 쿠키를 비우고 /login으로 리다이렉트
      await logout();
      // 혹시 남아있을 수 있는 react-query 캐시 모두 제거
      queryClient.clear();
    },
  });
}
