# TODOS — 향후 작업 백로그

이 파일은 현재 PR 범위 밖이나 기술 부채로 추적이 필요한 항목을 기록합니다.

---

## TODO-1: SpeechInterviewService 헥사고날 아키텍처 위반

**현황:** `SpeechInterviewService`가 `api/` 레이어에 위치 (`api/speechinterview/SpeechInterviewService.java`).
순수 비즈니스 로직임에도 불구하고 REST 레이어인 `api/`에 존재하여 헥사고날 아키텍처 위반.

**이상적 상태:** `domain/speechinterview/service/SpeechInterviewService.java`로 이동.
`api/` 컨트롤러는 포트 인터페이스(`SpeechInterviewSessionRepository`, `InterviewAiPort`)만 통해 도메인에 접근.

**영향도:** 높음 (연관 import 전수 수정, ResumeQuestionService 등 유사 패턴 동시 정리 필요)

**참고:** `ResumeQuestionService` 등 동일 패턴 — 동시 마이그레이션 권장.

---

## TODO-2: 서비스 레이어 테스트 커버리지 확장

**현황:** `SpeechInterviewService`, `generateFeedbackAsync`, `AnswerFeedbackGenerator` 등
핵심 비즈니스 로직에 단위 테스트 전무. cleanup PR에서 기본 3개 추가 예정이나 전체 커버리지 부족.

**목표:**
- `SpeechInterviewService`: 첫 턴/MAX_TURNS/상태 머신/AI 오류 경로 전체
- `generateFeedbackAsync`: 비동기 트랜잭션 경계 검증
- `AnswerFeedbackGenerator`: behavioral 파라미터 제거 후 null 경로 검증
- `complete()` IllegalStateException 경계 케이스

**참고:** cleanup PR(feat/speech-interview-cleanup) 이후 별도 `test/speech-interview-coverage` 브랜치 권장.

---

## TODO-3: @Async 자기 호출 (self-invocation) — 비동기 비작동

**현황:** `SpeechInterviewService.generateFeedbackAsync()`는 같은 빈 내부에서 `this.generateFeedbackAsync()` 형태로 호출됨.
Spring AOP 프록시를 우회하므로 `@Async` 어노테이션이 **실제로 무시**되어 동기 실행됨.
채팅 요청이 피드백 AI 호출 완료까지 블로킹.

**이상적 상태:** `generateFeedbackAsync`를 별도 `@Service` 빈으로 추출 (예: `FeedbackAsyncService`).

**영향도:** 높음 (응답 지연, 최대 90초 블로킹 가능)

---

## TODO-4: 프론트엔드 잔여 카메라 분석 참조 정리

**현황:**
- `InterviewIntro.tsx:295` — "카메라 사용 시 시선·자세 분석이 추가됩니다" 문구 (삭제된 기능 광고)
- `speechInterviewApi.ts:16` — `useCamera: false` 필드 전송 (백엔드에서 무시되나 API 계약 불일치)

**이상적 상태:** 해당 UI 텍스트 제거, API 요청 바디에서 `useCamera` 필드 제거.

---

## TODO-5: Flyway 초기 스키마 마이그레이션 부재

**현황:** 기존 prod DB는 Hibernate `ddl-auto: update`로 생성됨. 현재 V1만 존재하며 초기 테이블 생성 스크립트 없음.
신규 환경 배포 시 `ddl-auto: validate`로 인해 테이블이 없어 시작 실패 가능.

**이상적 상태:** V0 또는 `V1__baseline_schema.sql`로 현재 스키마 스냅샷 작성.

**영향도:** 신규 prod 환경 또는 복구 시나리오에서만 발생. 기존 prod은 영향 없음.
