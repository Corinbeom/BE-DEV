import { AppShell } from "@/components/AppShell";

export default function InterviewPracticePage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">면접 연습</h1>
        <p className="text-slate-500">
          생성된 질문을 바탕으로 답변을 작성하고 AI 피드백을 받는 연습 화면을 확장할
          예정이에요.
        </p>
      </div>
    </AppShell>
  );
}


