-- Phase 7: 대화형 면접 도메인 테이블 + Feedback delivery 필드 생성
-- prod에 Phase 7이 처음 배포되는 경우 ddl-auto: validate 통과를 위해 생성
-- IF NOT EXISTS: 로컬/스테이징 등 이미 테이블이 존재하는 환경에서 안전하게 건너뜀

-- ── speech_interview_sessions ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS speech_interview_sessions (
    id                      BIGSERIAL PRIMARY KEY,
    member_id               BIGINT        NOT NULL,
    title                   VARCHAR(200)  NOT NULL,
    position_type           VARCHAR(50),
    source_resume_session_id BIGINT,
    status                  VARCHAR(20)   NOT NULL,
    resume_context          TEXT,
    created_at              TIMESTAMP     NOT NULL,
    completed_at            TIMESTAMP
);

-- ── speech_interview_questions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS speech_interview_questions (
    id            BIGSERIAL PRIMARY KEY,
    session_id    BIGINT        NOT NULL,
    order_index   INT           NOT NULL,
    badge         VARCHAR(100)  NOT NULL,
    question_text TEXT          NOT NULL,
    intention     TEXT,
    keywords      VARCHAR(500),
    model_answer  TEXT
);

-- ── speech_interview_answers (embedded SpeechAnswerFeedback 포함) ──
CREATE TABLE IF NOT EXISTS speech_interview_answers (
    id               BIGSERIAL PRIMARY KEY,
    question_id      BIGINT       NOT NULL UNIQUE,
    answer_text      TEXT         NOT NULL,
    feedback_status  VARCHAR(20)  NOT NULL,
    created_at       TIMESTAMP    NOT NULL,
    suggested_answer TEXT
);

-- ── speech_feedback @ElementCollection 테이블 ─────────────────────
CREATE TABLE IF NOT EXISTS speech_feedback_strengths (
    answer_id BIGINT        NOT NULL,
    strength  VARCHAR(2000),
    idx       INT           NOT NULL
);

CREATE TABLE IF NOT EXISTS speech_feedback_improvements (
    answer_id   BIGINT        NOT NULL,
    improvement VARCHAR(2000),
    idx         INT           NOT NULL
);

CREATE TABLE IF NOT EXISTS speech_feedback_followups (
    answer_id BIGINT        NOT NULL,
    followup  VARCHAR(2000),
    idx       INT           NOT NULL
);

CREATE TABLE IF NOT EXISTS speech_feedback_delivery_strengths (
    answer_id        BIGINT        NOT NULL,
    delivery_strength VARCHAR(2000),
    idx              INT           NOT NULL
);

CREATE TABLE IF NOT EXISTS speech_feedback_delivery_improvements (
    answer_id            BIGINT        NOT NULL,
    delivery_improvement VARCHAR(2000),
    idx                  INT           NOT NULL
);

-- ── resume_feedback delivery @ElementCollection 테이블 (Phase 7 확장) ──
CREATE TABLE IF NOT EXISTS resume_feedback_delivery_strengths (
    attempt_id        BIGINT        NOT NULL,
    delivery_strength VARCHAR(2000),
    idx               INT           NOT NULL
);

CREATE TABLE IF NOT EXISTS resume_feedback_delivery_improvements (
    attempt_id           BIGINT        NOT NULL,
    delivery_improvement VARCHAR(2000),
    idx                  INT           NOT NULL
);
