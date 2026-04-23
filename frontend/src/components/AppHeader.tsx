"use client";

import { usePathname } from "next/navigation";

function headerLabel(pathname: string): string {
  if (pathname.startsWith("/application-tracker")) return "지원 현황";
  if (pathname.startsWith("/study-quiz")) return "CS 문제풀이";
  if (pathname.startsWith("/resume-analyzer")) return "이력서 면접";
  if (pathname.startsWith("/profile")) return "프로필";
  return "대시보드";
}

interface AppHeaderProps {
  detailOpen?: boolean;
  onToggleDetail?: () => void;
}

export function AppHeader({ detailOpen, onToggleDetail }: AppHeaderProps) {
  const pathname = usePathname();
  const label = headerLabel(pathname);

  return (
    <header className="flex h-12 flex-shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <span className="text-[13px] font-semibold text-foreground">{label}</span>
      {onToggleDetail && (
        <button
          onClick={onToggleDetail}
          className="hidden xl:flex items-center justify-center size-7 rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={detailOpen ? "패널 숨기기" : "패널 보기"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {detailOpen ? "right_panel_close" : "right_panel_open"}
          </span>
        </button>
      )}
    </header>
  );
}
