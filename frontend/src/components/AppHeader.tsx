"use client";

import { usePathname } from "next/navigation";

function headerCopy(pathname: string) {
  if (pathname.startsWith("/application-tracker")) {
    return {
      title: "지원 현황 관리",
      subtitle: "칸반 보드로 전형 단계를 한눈에 관리해요.",
      cta: "새 지원 추가",
    };
  }
  if (pathname.startsWith("/study-quiz")) {
    return {
      title: "CS 문제풀이",
      subtitle: "카테고리별 문제로 실전 감각을 쌓아보세요.",
      cta: "오늘의 세션",
    };
  }
  if (pathname.startsWith("/resume-analyzer")) {
    return {
      title: "이력서 기반 면접 준비",
      subtitle: "이력서/포트폴리오에 맞춘 질문과 피드백을 받아요.",
      cta: "프로필 보기",
    };
  }
  return {
    title: "환영합니다, Alex!",
    subtitle: "이번 주 상위 15%의 학습 페이스예요.",
    cta: "프로필 보기",
  };
}

export function AppHeader() {
  const pathname = usePathname();
  const copy = headerCopy(pathname);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/80 px-8 py-4 backdrop-blur-md dark:bg-background-dark/80">
      <div className="flex flex-col">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
          {copy.title}
        </h2>
        <p className="text-sm font-medium text-slate-500">{copy.subtitle}</p>
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-full p-2 transition-colors hover:bg-slate-200 dark:hover:bg-white/10"
          aria-label="알림"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button
          type="button"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all active:scale-95 hover:bg-primary/90"
        >
          {copy.cta}
        </button>
      </div>
    </header>
  );
}


