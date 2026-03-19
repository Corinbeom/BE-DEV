import { Card } from "@/components/ui/card";

export function QuestionSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="animate-pulse p-3">
          <div className="flex items-center gap-3">
            <div className="size-7 shrink-0 rounded-full bg-muted" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-14 rounded-full bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
