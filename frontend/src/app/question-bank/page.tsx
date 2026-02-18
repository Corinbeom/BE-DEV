import { AppShell } from "@/components/AppShell";

export default function QuestionBankPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">문제 은행</h1>
        <p className="text-slate-500">
          OS/DB/Network/DS/Algorithm 카테고리 기반 문제와 AI 첨삭 기능을 여기에 붙일
          예정이에요.
        </p>
      </div>
    </AppShell>
  );
}


