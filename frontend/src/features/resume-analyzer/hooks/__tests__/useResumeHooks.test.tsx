import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeResumeSession,
  createResumeSession,
  generateCoachingReport,
  getResumeSession,
  listResumeSessions,
} from "../../api/resumeSessionApi";
import {
  useCompleteResumeSession,
  useCreateResumeSession,
  useGenerateCoachingReport,
} from "../useResumeMutations";
import { useResumeSession } from "../useResumeSession";
import { useResumeSessions } from "../useResumeSessions";

vi.mock("../../api/resumeSessionApi", () => ({
  completeResumeSession: vi.fn(),
  createResumeSession: vi.fn(),
  generateCoachingReport: vi.fn(),
  getResumeSession: vi.fn(),
  listResumeSessions: vi.fn(),
}));

function createWrapper(queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})) {
  return {
    queryClient,
    wrapper: ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resume analyzer hooks", () => {
  it("useResumeSessions는 세션 목록을 조회한다", async () => {
    vi.mocked(listResumeSessions).mockResolvedValueOnce([{ id: 1, title: "이력서" }] as never);
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useResumeSessions(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([{ id: 1, title: "이력서" }]));
    expect(listResumeSessions).toHaveBeenCalledTimes(1);
  });

  it("useResumeSession은 sessionId가 null이면 조회하지 않는다", () => {
    const { wrapper } = createWrapper();

    const { result } = renderHook(() => useResumeSession(null), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(getResumeSession).not.toHaveBeenCalled();
  });

  it("useCreateResumeSession은 생성 후 목록 쿼리를 invalidate한다", async () => {
    vi.mocked(createResumeSession).mockResolvedValueOnce({ id: 5 } as never);
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["resumeSessions"], [{ id: 1 }]);
    const { result } = renderHook(() => useCreateResumeSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ positionType: "BE", resumeId: 10 });
    });

    expect(vi.mocked(createResumeSession).mock.calls[0][0]).toEqual({ positionType: "BE", resumeId: 10 });
    expect(queryClient.getQueryState(["resumeSessions"])?.isInvalidated).toBe(true);
  });

  it("useCompleteResumeSession은 상세 캐시를 갱신하고 목록을 invalidate한다", async () => {
    vi.mocked(completeResumeSession).mockResolvedValueOnce({ id: 8, status: "COMPLETED" } as never);
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["resumeSessions"], [{ id: 8 }]);
    const { result } = renderHook(() => useCompleteResumeSession(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(8);
    });

    expect(queryClient.getQueryData(["resumeSession", 8])).toEqual({ id: 8, status: "COMPLETED" });
    expect(queryClient.getQueryState(["resumeSessions"])?.isInvalidated).toBe(true);
  });

  it("useGenerateCoachingReport는 coachingReport 캐시를 갱신한다", async () => {
    vi.mocked(generateCoachingReport).mockResolvedValueOnce({ summary: "좋음" } as never);
    const { queryClient, wrapper } = createWrapper();
    const { result } = renderHook(() => useGenerateCoachingReport(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(queryClient.getQueryData(["coachingReport"])).toEqual({ summary: "좋음" });
  });
});
