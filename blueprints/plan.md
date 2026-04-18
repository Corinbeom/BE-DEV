# AI 호출 토큰 최소화 — Plan

## 현황 분석

### AI 호출 지점 (6개)

| # | 호출 지점 | 트리거 | 빈도 | 캐싱 | 횟수 제한 |
|---|---|---|---|---|---|
| 1 | `QuestionGenerator.generateQuestions` | 세션 생성 | 세션당 1회 | 불필요 (1회성) | O (세션 생성 = 1회) |
| 2 | `AnswerFeedbackGenerator.generateFeedback` | 답변 제출 | **질문당 무제한** | **X** | **X** |
| 3 | `CsQuizFeedbackGenerator` (객관식 오답) | 오답 제출 | **문제당 무제한** | **X** | **X** |
| 4 | `CsQuizFeedbackGenerator` (주관식) | 답변 제출 | **문제당 무제한** | **X** | **X** |
| 5 | `ResumeSessionService.generateReport` | 리포트 생성 | 세션당 1회 | O (reportJson) | O (캐시 있으면 스킵) |
| 6 | `ResumeSessionService.generateCoachingReport` | 코칭 리포트 | **무제한 재생성** | △ (덮어씀) | **X** |

### 토큰 낭비 핫스팟 (우선순위순)

**1. 피드백 무제한 재시도 (#2, #3, #4) — 가장 큰 낭비**
- 질문 5개 × 답변 10회 = 50회 AI 호출 가능 (제한 없음)
- 피드백 1회당 ~700 토큰 → 세션당 최대 35,000 토큰
- CS 퀴즈도 동일 구조

**2. 프롬프트 중복 규칙 — 구조적 낭비**
- "JSON 한 줄 minified", "큰따옴표 금지", "줄바꿈 금지" 등 동일 규칙이 AiPromptBuilder 내 6개 프롬프트 + Retry Rules에 14회 반복
- 프롬프트당 ~150토큰 × 14 = 매 호출마다 낭비
- Retry 시 원본 프롬프트 전체 + retry rules를 다시 보냄 → attempt 2/3에서 프롬프트 크기 누적 증가

**3. 코칭 리포트 무제한 재생성 (#6)**
- 데이터 변경 없이 버튼 연타로 재생성 가능
- 코칭 프롬프트 ~460토큰 + 세션 데이터 8,000~10,000토큰 = 1회당 ~10,000토큰

**4. maxOutputTokens 일괄 8192**
- Gemini: 모든 호출에 `maxOutputTokens: 8192` 동일 적용
- 피드백은 실제 ~500토큰만 필요한데 8192 할당 → 불필요한 예약

## 개선 계획

### P0: 도메인 레벨 피드백 횟수 제한

**목표:** 질문/문제당 AI 피드백 호출 횟수를 최대 3회로 제한하여 가장 빈번한 토큰 낭비 차단.

**데이터 구조:**
- 제한 없음 (엔티티 변경 불필요). `question.getAttempts().size()` 로 현재 시도 횟수 확인 가능.

**엔티티 로직 (Rich Domain Model):**
- `ResumeQuestion.canAttempt()` — attempts 크기 < MAX_ATTEMPTS (3회)
- `CsQuizQuestion.canAttempt()` — 동일 (각 3회)

**서비스 변경:**
- `ResumeQuestionService.createFeedback()` — `question.canAttempt()` 검증 추가
- `CsQuizQuestionService.submitAttempt()` — `question.canAttempt()` 검증 추가
- 초과 시 `IllegalStateException("최대 답변 횟수(3회)를 초과했습니다.")`

**프론트엔드:**
- 피드백 UI에서 시도 횟수 표시 (e.g. "3/3회")
- MAX 도달 시 답변 입력 비활성화 + 안내 메시지

### P1: 프롬프트 공통 규칙 추출 (중복 제거)

**목표:** 6개 프롬프트에 반복되는 JSON 포맷 규칙을 상수로 추출하여 프롬프트 크기 축소.

**변경 파일:** `AiPromptBuilder.java`

**방법:**
```java
private static final String JSON_FORMAT_RULES = """
        - JSON은 한 줄로(minified) 출력하세요. 공백/개행/설명 문장 금지.
        - 모든 문자열 값에는 줄바꿈을 넣지 마세요(필요하면 \\n 으로 escape).
        - 문자열 값 안에는 큰따옴표(") 문자를 넣지 마세요.
        """;
```
- 각 프롬프트에서 중복 3줄 제거 → `JSON_FORMAT_RULES` 참조
- Retry Rules에서도 동일 3줄 제거 → 차별화된 축소 규칙만 남김

**효과:** 프롬프트당 ~50토큰 절약 × 6개 = 호출당 ~50토큰 절약

### P2: Retry Rules를 시스템 인스트럭션으로 이동

**목표:** Retry 시 프롬프트를 누적하지 않고, 시스템 인스트럭션에 포맷 규칙을 넣어 retry 비용 절감.

**변경 파일:** `GeminiInterviewAiAdapter.java`, `GroqInterviewAiAdapter.java`

**방법:**
- 공통 JSON 포맷 규칙을 systemInstruction에 추가 (1회만 전송)
- 각 프롬프트에서 포맷 규칙 제거 (스키마 + 도메인 지시만 남김)
- Retry 시: attempt 2/3에서 프롬프트 원문은 유지, 길이 제한만 축소된 systemInstruction 사용

**효과:** Retry 시 프롬프트 크기가 증가하지 않음 → attempt 2/3에서 각 ~150토큰 절약

### P3: maxOutputTokens 프로필별 분리

**목표:** AI 호출 유형에 따라 적절한 출력 토큰 상한 설정.

**변경 파일:** `GeminiInterviewAiAdapter.java`

**방법:**
```java
int tokens = switch (profile) {
    case FEEDBACK -> 2048;
    case QUESTIONS, QUIZ_QUESTIONS -> 4096;
    case SESSION_REPORT -> 4096;
    case COACHING -> 4096;
};
```

**효과:** FEEDBACK에서 8192→2048, 과도한 예약 방지 + 응답 속도 개선 가능성

### P4: 코칭 리포트 재생성 쿨다운

**목표:** 데이터 변경 없이 반복 재생성 방지.

**데이터 구조:**
- `Member` 엔티티에 `coachingReportGeneratedAt` (LocalDateTime) 필드 추가

**엔티티 로직:**
- `Member.canRegenerateCoachingReport()` — generatedAt이 null이거나 24시간 경과

**서비스 변경:**
- `generateCoachingReport()` — `member.canRegenerateCoachingReport()` 검증
- 초과 시 `IllegalStateException("코칭 리포트는 24시간에 1회만 재생성할 수 있습니다.")`

**프론트엔드:**
- 재생성 버튼에 남은 쿨다운 시간 표시
- 쿨다운 중 버튼 비활성화

## 변경 파일 목록

### Backend
| 파일 | 변경 내용 |
|---|---|
| `domain/resume/session/model/ResumeQuestion.java` | `canAttempt()` 메서드 + MAX_ATTEMPTS 상수 |
| `domain/studyquiz/session/model/CsQuizQuestion.java` | `canAttempt()` 메서드 + MAX_ATTEMPTS 상수 |
| `domain/member/model/Member.java` | `coachingReportGeneratedAt` + `canRegenerateCoachingReport()` |
| `api/resume/question/ResumeQuestionService.java` | canAttempt 검증 |
| `api/studyquiz/question/CsQuizQuestionService.java` | canAttempt 검증 |
| `api/resume/session/ResumeSessionService.java` | 코칭 리포트 쿨다운 검증 |
| `infra/ai/AiPromptBuilder.java` | JSON_FORMAT_RULES 상수 추출, 프롬프트 축소 |
| `infra/ai/gemini/GeminiInterviewAiAdapter.java` | 시스템 인스트럭션 포맷 규칙, maxOutputTokens 분리, retry 개선 |
| `infra/ai/groq/GroqInterviewAiAdapter.java` | 동일 |

### Frontend
| 파일 | 변경 내용 |
|---|---|
| `features/resume-analyzer/api/types.ts` | ResumeQuestion에 maxAttempts 추가 |
| `features/resume-analyzer/components/ResumePortfolioPrepView.tsx` | 시도 횟수 표시 + 제한 도달 시 비활성화 |
| `features/study-quiz/components/StudyQuizPracticeView.tsx` | 동일 |
| `features/resume-analyzer/components/InterviewReportView.tsx` | 코칭 리포트 쿨다운 UI |

## 예상 효과

| 항목 | Before | After |
|---|---|---|
| 피드백 호출/세션 (최악) | 무제한 (50+ 가능) | 최대 25회 (5질문 × 5회) |
| 프롬프트 크기 (피드백) | ~700토큰 | ~600토큰 |
| Retry 추가 비용 | +150토큰/attempt | +50토큰/attempt |
| 코칭 리포트 재생성 | 무제한 | 24시간 쿨다운 |
| maxOutputTokens (피드백) | 8192 | 2048 |

## 구현 순서

1. P0 → P1 → P2 → P3 → P4 (의존성 없이 독립적)
2. 단일 브랜치 `refactor/ai-token-optimization`
3. Backend compileJava + test → Frontend tsc --noEmit 검증
