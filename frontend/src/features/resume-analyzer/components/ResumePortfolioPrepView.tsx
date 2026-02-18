export function ResumePortfolioPrepView() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#111118]">
          이력서 · 포트폴리오 면접 준비
        </h1>
        <p className="max-w-2xl text-lg text-slate-500">
          문서를 업로드하거나 작업 링크를 연결하면, 맞춤형 AI 질문을 생성하고 실시간으로
          답변 연습을 할 수 있어요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col rounded-xl border border-primary/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
              upload_file
            </span>
            <h3 className="text-lg font-bold">PDF 이력서 업로드</h3>
          </div>

          <div className="cursor-pointer rounded-xl border-2 border-dashed border-primary/20 bg-slate-50 p-8 transition-colors hover:bg-primary/5">
            <div className="flex flex-col items-center justify-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-primary/40">
                cloud_upload
              </span>
              <p className="text-center text-sm text-slate-600">
                PDF를 여기로 끌어오거나,{" "}
                <span className="font-bold text-primary underline">파일 찾아보기</span>
              </p>
              <p className="mt-2 text-xs text-slate-400">최대 파일 크기: 5MB</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-xl border border-primary/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
          <div className="mb-4 flex items-center gap-3">
            <span className="material-symbols-outlined rounded-lg bg-primary/10 p-2 text-primary">
              link
            </span>
            <h3 className="text-lg font-bold">포트폴리오 링크</h3>
          </div>

          <div className="flex h-full flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                GitHub · Notion · 개인 웹사이트 URL
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="https://github.com/username/project"
              />
            </label>
            <button
              type="button"
              className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-white transition-all hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-sm">analytics</span>
              프로필 분석하기
            </button>
          </div>
        </section>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-8 xl:grid-cols-12">
        <section className="flex flex-col gap-4 xl:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <span className="material-symbols-outlined text-primary">
                psychology
              </span>
              생성된 질문
            </h2>
            <span className="rounded bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
              8개
            </span>
          </div>

          <div className="custom-scrollbar flex max-h-[800px] flex-col gap-3 overflow-y-auto pr-2">
            <QuestionCard
              badge="프로젝트 기반"
              badgeTone="primary"
              likelihood={92}
              text="“이력서에 적힌 ‘E-commerce React’ 프로젝트의 아키텍처를 설명해 주세요.”"
              active
            />
            <QuestionCard
              badge="기술적 난관"
              badgeTone="muted"
              likelihood={85}
              text="“OAuth2를 구현하면서 가장 어려웠던 기술적 문제는 무엇이었나요?”"
            />
            <QuestionCard
              badge="협업/행동"
              badgeTone="muted"
              likelihood={78}
              text="“팀 프로젝트에서 기술적 의견 충돌이 있었을 때 어떻게 조율했나요?”"
            />
            <QuestionCard
              badge="기술 스택"
              badgeTone="muted"
              likelihood={65}
              text="“최근 포트폴리오에서 MongoDB 대신 PostgreSQL을 선택한 이유는 무엇인가요?”"
            />
          </div>
        </section>

        <section className="flex flex-col gap-6 xl:col-span-8">
          <div className="flex h-full flex-col overflow-hidden rounded-xl border border-primary/10 bg-white shadow-lg">
            <div className="border-b border-slate-100 bg-slate-50/50 p-6">
              <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-primary">
                진행 중인 연습 세션
              </h3>
              <p className="text-xl font-bold text-[#111118]">
                질문: ‘E-commerce React’ 프로젝트의 아키텍처를 설명해 주세요.
              </p>
            </div>

            <div className="flex flex-1 flex-col gap-4 p-6">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">
                    lightbulb
                  </span>
                  팁: STAR 기법(Situation, Task, Action, Result)을 활용해 보세요.
                </span>
              </div>

              <textarea
                className="min-h-[300px] w-full flex-1 resize-none rounded-lg border-none bg-slate-50 p-6 text-lg leading-relaxed outline-none placeholder:text-slate-300 focus:ring-2 focus:ring-primary/20"
                placeholder="여기에 답변을 작성해 보세요... 예: 이 프로젝트에서는 비동기 사이드 이펙트가 많아 마이크로서비스 아키텍처를 선택했고..."
              />

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 text-slate-400 transition-colors hover:text-primary"
                    aria-label="음성 입력"
                  >
                    <span className="material-symbols-outlined">mic</span>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-slate-400 transition-colors hover:text-primary"
                    aria-label="목차"
                  >
                    <span className="material-symbols-outlined">
                      format_list_bulleted
                    </span>
                  </button>
                  <button
                    type="button"
                    className="p-2 text-slate-400 transition-colors hover:text-primary"
                    aria-label="코드"
                  >
                    <span className="material-symbols-outlined">code</span>
                  </button>
                </div>

                <button
                  type="button"
                  className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90"
                >
                  <span className="material-symbols-outlined">auto_fix_high</span>
                  AI 피드백 받기
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="flex items-center gap-2 font-bold text-slate-700">
                  <span className="material-symbols-outlined text-green-500">
                    check_circle
                  </span>
                  AI 평가
                </h4>
                <div className="flex gap-1">
                  <div className="size-2 rounded-full bg-green-500" />
                  <div className="size-2 rounded-full bg-yellow-400" />
                  <div className="size-2 rounded-full bg-slate-300" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-tighter text-green-600">
                    잘한 점
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs text-green-500">
                        done
                      </span>
                      기술 스택 선택 이유가 명확해요.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs text-green-500">
                        done
                      </span>
                      용어 사용이 정확하고 일관돼요.
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-tighter text-amber-600">
                    개선할 점
                  </p>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs text-amber-500">
                        info
                      </span>
                      상태 관리 전략을 조금 더 구체적으로 말해보세요.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-xs text-amber-500">
                        info
                      </span>
                      결정의 “성과/영향”을 수치로 강조해보면 좋아요.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-primary/10 bg-primary/5 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-tighter text-primary">
                  AI 개선 예시 답변
                </p>
                <p className="text-sm italic leading-relaxed text-slate-700">
                  “이 프로젝트에서는 비동기 사이드 이펙트를 안정적으로 다루기 위해
                  Redux-Saga 기반으로 설계했습니다. 데이터 프리패칭을 최적화해 평균 응답
                  지연을 15% 줄였고…”
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-6 rounded-xl border border-primary/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              시도한 질문
            </span>
            <span className="text-2xl font-black text-primary">03 / 08</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              평균 점수
            </span>
            <span className="text-2xl font-black text-green-500">84%</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined">download</span>
            연습 기록 내보내기
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 font-bold text-white transition-all hover:bg-primary/90"
          >
            <span className="material-symbols-outlined">navigate_next</span>
            다음 연습 세션
          </button>
        </div>
      </section>
    </div>
  );
}

function QuestionCard({
  badge,
  badgeTone,
  likelihood,
  text,
  active,
}: {
  badge: string;
  badgeTone: "primary" | "muted";
  likelihood: number;
  text: string;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "group cursor-pointer rounded-lg bg-white p-4 shadow-sm transition-all hover:shadow-md",
        "border-l-4",
        active ? "border-primary" : "border-slate-200",
      ].join(" ")}
    >
      <div className="mb-2 flex items-start justify-between">
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
            badgeTone === "primary"
              ? "bg-primary text-white"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {badge}
        </span>
        <span className="flex items-center gap-1 text-xs text-slate-400">
          <span className="material-symbols-outlined text-xs">trending_up</span>
          출제 확률: {likelihood}%
        </span>
      </div>
      <p className="text-sm font-semibold text-[#111118] transition-colors group-hover:text-primary">
        {text}
      </p>
    </div>
  );
}


