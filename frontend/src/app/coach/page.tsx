import { AppFrame } from "@/components/AppFrame";

export default function CoachPage() {
  return (
    <AppFrame>
      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-muted-foreground">AI Coach</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">코치 대시보드 준비 중</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          관심 직무 설정이 완료되었습니다. 다음 단계에서 지원 현황과 학습 기록을 분석하는 코치 대시보드가 연결됩니다.
        </p>
      </div>
    </AppFrame>
  );
}
