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
