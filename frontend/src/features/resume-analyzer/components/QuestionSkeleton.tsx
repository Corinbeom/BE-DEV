export function QuestionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border-l-4 border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
        >
          <div className="mb-2 flex items-start justify-between">
            <div className="h-4 w-16 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="h-3 w-20 rounded bg-slate-100 dark:bg-white/5" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-slate-100 dark:bg-white/5" />
            <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
