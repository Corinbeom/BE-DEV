import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseSseEvent, streamAssistantChat } from "../assistantApi";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  mockFetch.mockReset();
});

describe("parseSseEvent", () => {
  it("JSON data 이벤트를 파싱한다", () => {
    expect(parseSseEvent('data: {"token":"안녕"}')).toEqual({ token: "안녕" });
    expect(parseSseEvent('event: message\ndata: {"done":true}')).toEqual({ done: true });
  });

  it("잘못된 JSON은 parse_error로 반환한다", () => {
    expect(parseSseEvent("data: {broken")).toEqual({ error: "parse_error" });
  });

  it("data 라인이 없으면 null을 반환한다", () => {
    expect(parseSseEvent(": keep-alive")).toBeNull();
  });
});

describe("streamAssistantChat", () => {
  it("POST SSE 요청을 보내고 토큰과 done 이벤트를 순서대로 전달한다", async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"token":"안"}\n\n'));
        controller.enqueue(encoder.encode('data: {"token":"녕"}\n\ndata: {"done":true}\n\n'));
        controller.close();
      },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: stream,
    });
    const onToken = vi.fn();
    const onDone = vi.fn();
    const onError = vi.fn();

    await streamAssistantChat(
      { message: "이번 주 계획", history: [{ role: "assistant", content: "첫 진단" }] },
      {
        signal: new AbortController().signal,
        onToken,
        onDone,
        onError,
      },
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:8080/api/assistant/chat",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        }),
      }),
    );
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      message: "이번 주 계획",
      history: [{ role: "assistant", content: "첫 진단" }],
    });
    expect(onToken.mock.calls.map(([token]) => token)).toEqual(["안", "녕"]);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it("비정상 응답은 ApiResponse error message를 throw한다", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ error: { message: "message는 필수입니다." } }),
    });

    await expect(
      streamAssistantChat(
        { message: "", history: [] },
        {
          signal: new AbortController().signal,
          onToken: vi.fn(),
          onDone: vi.fn(),
          onError: vi.fn(),
        },
      ),
    ).rejects.toThrow("message는 필수입니다.");
  });
});
