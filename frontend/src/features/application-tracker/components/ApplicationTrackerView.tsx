export function ApplicationTrackerView() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap gap-4">
        <StatCard
          label="총 지원"
          value="42"
          icon="description"
          iconClass="text-primary bg-primary/10"
          footer="+5 이번 주"
          footerTone="good"
        />
        <StatCard
          label="면접"
          value="8"
          icon="event"
          iconClass="text-amber-500 bg-amber-500/10"
          footer="다음 주 예정 3건"
        />
        <StatCard
          label="오퍼"
          value="2"
          icon="workspace_premium"
          iconClass="text-emerald-500 bg-emerald-500/10"
          footer="성공률: 4.8%"
        />
      </section>

      <section className="flex items-center justify-between">
        <div className="flex w-fit rounded-lg bg-slate-200/50 p-1 dark:bg-slate-800">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md bg-white px-4 py-1.5 text-sm font-bold text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
          >
            <span className="material-symbols-outlined text-lg">view_kanban</span>
            칸반
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
          >
            <span className="material-symbols-outlined text-lg">table_chart</span>
            테이블
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="material-symbols-outlined text-lg">filter_list</span>
            필터
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="material-symbols-outlined text-lg">sort</span>
            정렬
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
        <KanbanColumn title="지원 완료" count={12}>
          <KanbanCard
            company="Stripe"
            role="시니어 프로덕트 디자이너"
            dateLabel="지원"
            date="2023-10-24"
            tag="신규"
            tagTone="primary"
          />
          <KanbanCard
            company="Airbnb"
            role="UX 리서처"
            dateLabel="지원"
            date="2023-10-22"
            tag="대기"
            tagTone="primary"
            noteCount={1}
          />
        </KanbanColumn>

        <KanbanColumn title="서류 검토" count={6}>
          <KanbanCard
            company="Notion"
            role="UI 엔지니어"
            dateLabel="검토 시작"
            date="2023-10-20"
            tag="스크리닝"
            tagTone="amber"
          />
        </KanbanColumn>

        <KanbanColumn title="면접 진행" count={4}>
          <KanbanCard
            company="Figma"
            role="시니어 UI 디자이너"
            dateLabel="라운드 2"
            date="내일(기술)"
            tag="예정"
            tagTone="amber"
            highlight
            noteCount={3}
          />
        </KanbanColumn>

        <KanbanColumn title="최종 결과" count={14}>
          <KanbanCard
            company="Vercel"
            role="프론트엔드 리드"
            dateLabel="오퍼"
            date="3일 남음"
            tag="오퍼"
            tagTone="emerald"
          />
          <KanbanCard
            company="Meta"
            role="프로덕트 디자이너"
            dateLabel="결정"
            date="2023-10-15"
            tag="마감"
            tagTone="muted"
            dimmed
          />
          <EmptySlot />
        </KanbanColumn>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconClass,
  footer,
  footerTone,
}: {
  label: string;
  value: string;
  icon: string;
  iconClass: string;
  footer: string;
  footerTone?: "good";
}) {
  return (
    <div className="min-w-[200px] flex-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <span className={["material-symbols-outlined rounded-lg p-2", iconClass].join(" ")}>
          {icon}
        </span>
      </div>
      <p className="text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      <p
        className={
          footerTone === "good"
            ? "mt-2 flex items-center gap-1 text-xs font-bold text-emerald-500"
            : "mt-2 text-xs text-slate-500"
        }
      >
        {footerTone === "good" ? (
          <>
            <span className="material-symbols-outlined text-xs">trending_up</span>
            {footer}
          </>
        ) : (
          footer
        )}
      </p>
    </div>
  );
}

function KanbanColumn({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[500px] flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold dark:bg-slate-800">
            {count}
          </span>
        </div>
        <button
          type="button"
          className="text-slate-400 hover:text-slate-600"
          aria-label="더보기"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

function KanbanCard({
  company,
  role,
  dateLabel,
  date,
  tag,
  tagTone,
  noteCount,
  highlight,
  dimmed,
}: {
  company: string;
  role: string;
  dateLabel: string;
  date: string;
  tag: string;
  tagTone: "primary" | "amber" | "emerald" | "muted";
  noteCount?: number;
  highlight?: boolean;
  dimmed?: boolean;
}) {
  const tagClass =
    tagTone === "primary"
      ? "bg-primary/10 text-primary"
      : tagTone === "amber"
        ? "bg-amber-500/10 text-amber-600"
        : tagTone === "emerald"
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-slate-100 text-slate-500 dark:bg-slate-800";

  return (
    <div
      className={[
        "cursor-grab rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900",
        highlight ? "border-l-4 border-l-amber-500" : "",
        dimmed ? "opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0" : "",
      ].join(" ")}
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="leading-tight font-bold text-slate-900 dark:text-white">
            {company}
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">{role}</p>
        </div>
        <div className="size-8 rounded bg-slate-50 p-1" />
      </div>

      {highlight ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 p-2 dark:bg-amber-500/10">
          <span className="material-symbols-outlined text-lg text-amber-600">
            upcoming
          </span>
          <p className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-500">
            {dateLabel}: {date}
          </p>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-slate-400">
            calendar_today
          </span>
          <p className="text-xs font-medium text-slate-500">
            {dateLabel} {date}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <span
          className={[
            "rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
            tagClass,
          ].join(" ")}
        >
          {tag}
        </span>

        <button
          type="button"
          className="flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-primary"
          aria-label="메모"
        >
          <span className="material-symbols-outlined text-lg">sticky_note_2</span>
          {noteCount != null ? <span className="text-[10px]">{noteCount}</span> : null}
        </button>
      </div>
    </div>
  );
}

function EmptySlot() {
  return (
    <div className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-slate-400 transition-colors hover:border-primary/30 dark:border-slate-800">
      <span className="material-symbols-outlined mb-1 text-3xl">add_circle</span>
      <p className="text-xs font-medium">여기에 추가</p>
    </div>
  );
}


