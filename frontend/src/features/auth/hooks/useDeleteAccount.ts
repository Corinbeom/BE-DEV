import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAccount } from "../api/authApi";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const { logout } = useAuth();

  return useMutation({
    mutationFn: (memberId: number) => deleteAccount(memberId),
    onSuccess: () => {
      toast.success("정상적으로 탈퇴되었습니다. 그동안 이용해 주셔서 감사합니다.");
      // 프론트엔드의 세션 쿠키 비우기 및 리다이렉션을 사용자가 토스트를 읽을 수 있도록 지연 실행
      setTimeout(async () => {
        await logout();
        queryClient.clear();
      }, 1500);
    },
  });
}
