import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <span className="material-symbols-outlined text-3xl text-muted-foreground">
            search_off
          </span>
        </div>
        <h1 className="text-xl font-bold text-foreground">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="text-sm text-muted-foreground">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}
