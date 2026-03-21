"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function headerCopy(pathname: string, displayName: string) {
  if (pathname.startsWith("/application-tracker")) {
    return {
      title: "지원 현황 관리",
      subtitle: "칸반 보드로 전형 단계를 한눈에 관리해요.",
      icon: "work",
      badge: "Tracker",
    };
  }
  if (pathname.startsWith("/study-quiz")) {
    return {
      title: "CS 문제풀이",
      subtitle: "카테고리별 문제로 실전 감각을 쌓아보세요.",
      icon: "code",
      badge: "Quiz",
    };
  }
  if (pathname.startsWith("/resume-analyzer")) {
    return {
      title: "이력서 기반 면접 준비",
      subtitle: "이력서/포트폴리오에 맞춘 질문과 피드백을 받아요.",
      icon: "description",
      badge: "AI Interview",
    };
  }
  if (pathname.startsWith("/profile")) {
    return {
      title: "프로필",
      subtitle: "개인 정보와 이력서/포트폴리오 파일을 관리해요.",
      icon: "person",
      badge: "Profile",
    };
  }
  return {
    title: `환영합니다, ${displayName}!`,
    subtitle: "오늘도 화이팅하세요.",
    icon: "dashboard",
    badge: "Dashboard",
  };
}

export function AppHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const displayName =
    user?.displayName ?? user?.email?.split("@")[0] ?? "사용자";
  const copy = headerCopy(pathname, displayName);

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="material-symbols-outlined">{copy.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {copy.title}
              </h2>
              <Badge variant="secondary" className="text-[10px] font-semibold uppercase tracking-wider">
                {copy.badge}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full" aria-label="알림">
            <span className="material-symbols-outlined text-xl">
              notifications
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
