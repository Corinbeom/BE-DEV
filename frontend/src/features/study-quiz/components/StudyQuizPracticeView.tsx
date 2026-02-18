export function StudyQuizPracticeView() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <aside className="custom-scrollbar lg:col-span-4 lg:pr-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-white/5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            카테고리
          </h3>

          <div className="space-y-1">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg bg-primary/10 px-4 py-3 font-bold text-primary transition-all"
            >
              <span className="material-symbols-outlined">desktop_windows</span>
              <span className="text-sm">운영체제</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium text-slate-500 transition-all hover:bg-background-light dark:text-slate-400 dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined">public</span>
              <span className="text-sm">컴퓨터 네트워크</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium text-slate-500 transition-all hover:bg-background-light dark:text-slate-400 dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined">database</span>
              <span className="text-sm">데이터베이스</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium text-slate-500 transition-all hover:bg-background-light dark:text-slate-400 dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined">code</span>
              <span className="text-sm">알고리즘</span>
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 font-medium text-slate-500 transition-all hover:bg-background-light dark:text-slate-400 dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined">memory</span>
              <span className="text-sm">컴퓨터 구조</span>
            </button>
          </div>

          <h3 className="mb-4 mt-10 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            문제 세트
          </h3>
          <div className="space-y-3">
            <div className="cursor-pointer rounded-xl border-2 border-primary bg-primary/5 p-4">
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase text-green-700">
                  쉬움
                </span>
                <span className="text-[11px] font-medium text-primary">
                  60% 완료
                </span>
              </div>
              <h4 className="mb-1 text-sm font-bold text-slate-900 dark:text-slate-100">
                메모리 관리
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                20문제 • 세트 1
              </p>
            </div>

            <div className="group cursor-pointer rounded-xl border border-slate-200 p-4 transition-all hover:border-primary/30 dark:border-white/5">
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                  보통
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  시작 전
                </span>
              </div>
              <h4 className="mb-1 text-sm font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
                프로세스 스케줄링
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                15문제 • 세트 2
              </p>
            </div>

            <div className="group cursor-pointer rounded-xl border border-slate-200 p-4 transition-all hover:border-primary/30 dark:border-white/5">
              <div className="mb-2 flex items-start justify-between">
                <span className="rounded bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase text-red-700">
                  어려움
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  시작 전
                </span>
              </div>
              <h4 className="mb-1 text-sm font-bold text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
                동시성 &amp; 락
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                25문제 • 세트 3
              </p>
            </div>
          </div>
        </div>
      </aside>

      <section className="custom-scrollbar lg:col-span-8">
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 dark:border-white/5 dark:bg-white/5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <nav className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>운영체제</span>
                <span className="material-symbols-outlined text-xs">
                  chevron_right
                </span>
                <span className="text-primary">메모리 관리 기초</span>
              </nav>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                20문제 중 12번
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  소요 시간
                </p>
                <p className="font-mono text-lg font-bold text-primary">02:45</p>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-all hover:bg-background-light dark:border-white/5 dark:text-slate-400 dark:hover:bg-white/5"
                aria-label="플래그"
              >
                <span className="material-symbols-outlined">flag</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>세션 진행률</span>
              <span>60%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: "60%" }}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/5 dark:bg-white/5">
          <div className="border-b border-slate-200 bg-primary/[0.02] p-8 dark:border-white/5">
            <h2 className="text-xl font-semibold leading-relaxed text-slate-900 dark:text-slate-100">
              다음 중 “프로세스가 메모리에 완전히 올라오지 않아도 실행 가능”하게 하는
              메모리 관리 기법은 무엇인가요?
            </h2>
          </div>

          <div className="space-y-4 p-8">
            <Option label="선택지 A" text="세그멘테이션(Segmentation)" />
            <Option
              label="선택지 B"
              text="가상 메모리(Virtual Memory)"
              checked
            />
            <Option label="선택지 C" text="단편화(Fragmentation)" />
            <Option label="선택지 D" text="동적 로딩(Dynamic Loading)" />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-6 border-t border-slate-200 bg-background-light p-8 dark:border-white/5 dark:bg-white/5">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3 font-bold text-slate-500 transition-all hover:bg-white dark:border-white/5 dark:text-slate-400 dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              이전
            </button>

            <div className="flex items-center gap-4">
              <button
                type="button"
                className="rounded-xl px-6 py-3 font-bold text-primary transition-all hover:bg-primary/10"
              >
                건너뛰기
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-primary px-10 py-3 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                <span>정답 제출</span>
                <span className="material-symbols-outlined">check_circle</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <div className="flex flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-white/5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <span className="material-symbols-outlined">lightbulb</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                힌트가 필요해요
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                세션 점수에서 5점이 차감돼요.
              </p>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/5 dark:bg-white/5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                이론 보기
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                메모리 관리 개념을 빠르게 복습해요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Option({
  label,
  text,
  checked,
}: {
  label: string;
  text: string;
  checked?: boolean;
}) {
  return (
    <label className="group relative flex cursor-pointer items-center rounded-xl border-2 border-slate-200 p-5 transition-all hover:border-primary/40 hover:bg-primary/[0.02] dark:border-white/5 dark:hover:bg-white/5">
      <input
        className="peer hidden"
        type="radio"
        name="answer"
        defaultChecked={checked}
      />
      <div className="flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 transition-all peer-checked:border-primary peer-checked:bg-primary dark:border-white/10">
        <div className="size-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
      </div>
      <div className="ml-4">
        <span className="mb-0.5 block text-sm font-bold text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className="text-base font-medium text-slate-900 dark:text-slate-100">{text}</span>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-primary opacity-0 transition-all peer-checked:opacity-100" />
    </label>
  );
}


