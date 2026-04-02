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

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90_000);

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

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(path, init?.method ?? "GET", res.status, text);
  }

  return (await res.json()) as T;
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
