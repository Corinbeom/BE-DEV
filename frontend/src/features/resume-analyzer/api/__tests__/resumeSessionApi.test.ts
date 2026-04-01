import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createResumeSession, listResumeSessions } from "../resumeSessionApi";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createResumeSession", () => {
  it("정상 호출 시 body에 targetTechnologies가 포함된다", async () => {
    const session = { id: 1, title: "세션1" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: session }),
    });

    const result = await createResumeSession({
      positionType: "BE",
      resumeId: 10,
      targetTechnologies: ["Java", "Spring", "Docker"],
    });

    expect(result).toEqual(session);

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.targetTechnologies).toEqual(["Java", "Spring", "Docker"]);
    expect(body.positionType).toBe("BE");
    expect(body.resumeId).toBe(10);
  });

  it("targetTechnologies 미전달 시 빈 배열로 전달된다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { id: 2 } }),
    });

    await createResumeSession({
      positionType: "FE",
      resumeId: 5,
    });

    const [, init] = mockFetch.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.targetTechnologies).toEqual([]);
  });

  it("실패 응답 시 Error를 throw한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false,
        error: { code: "ERR", message: "생성 실패" },
      }),
    });

    await expect(
      createResumeSession({ positionType: "BE", resumeId: 1 }),
    ).rejects.toThrow("생성 실패");
  });
});

describe("listResumeSessions", () => {
  it("정상 응답을 파싱하여 세션 배열을 반환한다", async () => {
    const sessions = [
      { id: 1, title: "세션1" },
      { id: 2, title: "세션2" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: sessions }),
    });

    const result = await listResumeSessions();
    expect(result).toEqual(sessions);
    expect(result).toHaveLength(2);
  });

  it("실패 응답 시 Error를 throw한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: { message: "조회 실패" } }),
    });

    await expect(listResumeSessions()).rejects.toThrow("조회 실패");
  });
});
