import type { DiagnosticResult } from "../api/types";

const iconByType: Record<DiagnosticResult["type"], string> = {
  RESUME: "description",
  INTERVIEW: "record_voice_over",
  QUIZ: "quiz",
  EMPTY: "inventory_2",
  NONE: "check_circle",
};

export function DiagnosticCard({ diagnostic }: { diagnostic: DiagnosticResult }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="material-symbols-outlined text-[22px]">{iconByType[diagnostic.type]}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-muted-foreground">첫 진단</p>
          <h2 className="mt-1 text-base font-bold text-foreground">{diagnostic.title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{diagnostic.message}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground">
            <span className="material-symbols-outlined text-base">flag</span>
            {diagnostic.action}
          </div>
        </div>
      </div>
    </section>
  );
}
