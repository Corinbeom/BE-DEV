import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch, healthCheck, ApiError } from "@/lib/api";

// global fetch mock
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("apiFetch", () => {
  it("정상 응답 시 JSON 파싱 결과를 반환한다", async () => {
    const body = { success: true, data: { id: 1 } };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => body,
    });

    const result = await apiFetch("/api/test");

    expect(result).toEqual(body);
    expect(mockFetch).toHaveBeenCalledOnce();

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/test");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.credentials).toBe("include");
  });

  it("HTTP 에러 시 ApiError를 throw한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "server error",
    });

    await expect(apiFetch("/api/fail")).rejects.toThrow("서버 오류가 발생했습니다. (500)");
    await mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => '{"success":false,"error":{"code":"INTERNAL_ERROR","message":"커스텀 에러"}}',
    });
    await expect(apiFetch("/api/fail")).rejects.toThrow("커스텀 에러");
  });

  it("ApiError에 path, status, detail이 포함된다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => "not found",
    });

    try {
      await apiFetch("/api/missing");
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      const err = e as ApiError;
      expect(err.path).toBe("/api/missing");
      expect(err.status).toBe(404);
      expect(err.detail).toContain("[GET /api/missing] 404");
    }
  });

  it("timeout AbortController 시그널이 전달된다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await apiFetch("/api/test");

    const [, init] = mockFetch.mock.calls[0];
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

describe("healthCheck", () => {
  it("서버 정상이면 true를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    const result = await healthCheck();
    expect(result).toBe(true);
  });

  it("서버 에러 시 false를 반환한다", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false });

    const result = await healthCheck();
    expect(result).toBe(false);
  });

  it("네트워크 장애 시 false를 반환한다", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const result = await healthCheck();
    expect(result).toBe(false);
  });
});
