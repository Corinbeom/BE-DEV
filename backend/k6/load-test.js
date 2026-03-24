import http from 'k6/http';
import { check, sleep } from 'k6';

// ============================================================
// k6 부하 테스트: N+1 + 캐싱 before/after 측정
//
// 사전 준비:
//   1. ./gradlew bootRun  (data.sql 시드 데이터 로드됨)
//   2. JWT 토큰 생성: curl로 로그인하거나 H2 콘솔에서 memberId=1 확인 후
//      아래 환경변수로 토큰 전달
//
// 실행:
//   k6 run --env BASE_URL=https://bedev-chi.vercel.app --env JWT_TOKEN=$TOKEN backend/k6/load-test.js
//
// Redis 캐싱 테스트:
//   docker run -d -p 6379:6379 redis:7-alpine
//   k6 run --env JWT_TOKEN=<token> backend/k6/load-test.js
// ============================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const JWT_TOKEN = __ENV.JWT_TOKEN || '';
const VUS = parseInt(__ENV.VUS || '30');
const DURATION = __ENV.DURATION || '30s';

export const options = {
  scenarios: {
    stats: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      exec: 'statsEndpoint',
      tags: { endpoint: 'stats' },
    },
    sessions: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      exec: 'sessionsEndpoint',
      tags: { endpoint: 'sessions' },
    },
    resumeSessions: {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      exec: 'resumeSessionsEndpoint',
      tags: { endpoint: 'resume-sessions' },
    },
  },
  thresholds: {
    'http_req_duration{endpoint:stats}': ['p(95)<500'],
    'http_req_duration{endpoint:sessions}': ['p(95)<500'],
    'http_req_duration{endpoint:resume-sessions}': ['p(95)<500'],
  },
};

const headers = {
  Cookie: `devweb_token=${JWT_TOKEN}`,
};

export function statsEndpoint() {
  const res = http.get(`${BASE_URL}/api/cs-quiz-sessions/stats`, { headers, tags: { endpoint: 'stats' } });
  check(res, {
    'stats 200': (r) => r.status === 200,
    'stats has data': (r) => JSON.parse(r.body).success === true,
  });
  sleep(0.1);
}

export function sessionsEndpoint() {
  const res = http.get(`${BASE_URL}/api/cs-quiz-sessions`, { headers, tags: { endpoint: 'sessions' } });
  check(res, {
    'sessions 200': (r) => r.status === 200,
  });
  sleep(0.1);
}

export function resumeSessionsEndpoint() {
  const res = http.get(`${BASE_URL}/api/resume-sessions`, { headers, tags: { endpoint: 'resume-sessions' } });
  check(res, {
    'resume-sessions 200': (r) => r.status === 200,
  });
  sleep(0.1);
}
