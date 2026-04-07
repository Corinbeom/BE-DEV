export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

const DEFAULT_BASE_URL = "http://localhost:8080";

export function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_BASE_URL;
}

/** apiFetch에서 throw하는 에러. 유저 메시지 + 디버그 상세를 분리 */
export class ApiError extends Error {
  constructor(
    public readonly path: string,
    public readonly method: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    // body에서 유저 친화적 메시지 추출
    let userMessage = `서버 오류가 발생했습니다. (${status})`;
    try {
      const parsed = JSON.parse(body);
      if (parsed?.error?.message) {
        userMessage = parsed.error.message;
      }
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    super(userMessage);
    this.name = "ApiError";
  }

  /** Discord 에러 리포트용 상세 정보 */
  get detail(): string {
    return `[${this.method} ${this.path}] ${this.status}\n${this.body}`;
  }
}

const MAX_RATE_LIMIT_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 20_000;

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    let res: Response;
    try {
      res = await fetch(`${apiBaseUrl()}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers ?? {}),
        },
        credentials: "include",
        cache: "no-store",
        signal: init?.signal ?? controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // 429 Rate Limit → 자동 대기 후 재시도 (사용자에게 에러 노출 없이)
    if (res.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      const retryAfter = parseRetryAfter(res);
      await sleep(retryAfter);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ApiError(path, init?.method ?? "GET", res.status, text);
    }

    return (await res.json()) as T;
  }

  // 재시도 모두 소진 — 도달할 수 없지만 타입 안전을 위해
  throw new ApiError(path, init?.method ?? "GET", 429, "요청이 제한되었습니다. 잠시 후 다시 시도해 주세요.");
}

function parseRetryAfter(res: Response): number {
  const header = res.headers.get("Retry-After");
  if (header) {
    const seconds = parseInt(header, 10);
    if (!isNaN(seconds) && seconds > 0) return seconds * 1000;
  }
  return DEFAULT_RETRY_DELAY_MS;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function healthCheck(): Promise<boolean> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${apiBaseUrl()}/`, {
      signal: controller.signal,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
