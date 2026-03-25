-- =============================================================
-- Seed data for performance testing (dev profile only)
-- Member 1, CsQuizSession 20, Question 10/session, Attempt 3/question
-- ResumeSession 10, ResumeQuestion 5/session
-- =============================================================

-- Member
INSERT INTO members (id, email, display_name, oauth_provider, oauth_subject)
VALUES (1, 'seed@devweb.com', 'Seed User', 'google', 'seed-subject-123');

-- ===================== CS Quiz Sessions (20) =====================
INSERT INTO cs_quiz_sessions (id, member_id, title, difficulty, status, created_at, updated_at) VALUES
(1,  1, 'OS 기초 퀴즈',          'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2,  1, 'Network 심화',          'HIGH', 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3,  1, 'DB 기초',               'LOW',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4,  1, 'Spring 핵심',           'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5,  1, 'Java 기초',             'LOW',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6,  1, 'Data Structure',        'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7,  1, 'Algorithm 실전',        'HIGH', 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8,  1, 'Architecture 패턴',     'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9,  1, 'Cloud 입문',            'LOW',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 'OS + Network 종합',     'HIGH', 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 1, 'DB 심화',               'HIGH', 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 1, 'Spring + Java',         'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(13, 1, 'DS + Algo',             'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(14, 1, 'Cloud + Arch',          'HIGH', 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(15, 1, 'OS 심화 2',             'HIGH', 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(16, 1, 'Network 기초 2',        'LOW',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(17, 1, 'DB + Spring',           'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(18, 1, 'Java 심화 2',           'HIGH', 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(19, 1, 'Algorithm 기초 2',      'LOW',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(20, 1, 'Architecture 종합 2',   'MID',  'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Session topics (2 per session)
INSERT INTO cs_quiz_session_topics (session_id, topic) VALUES
(1,'OS'),(1,'NETWORK'),(2,'NETWORK'),(2,'DB'),(3,'DB'),(3,'SPRING'),
(4,'SPRING'),(4,'JAVA'),(5,'JAVA'),(5,'DATA_STRUCTURE'),(6,'DATA_STRUCTURE'),(6,'ALGORITHM'),
(7,'ALGORITHM'),(7,'ARCHITECTURE'),(8,'ARCHITECTURE'),(8,'CLOUD'),(9,'CLOUD'),(9,'OS'),
(10,'OS'),(10,'NETWORK'),(11,'DB'),(11,'SPRING'),(12,'SPRING'),(12,'JAVA'),
(13,'DATA_STRUCTURE'),(13,'ALGORITHM'),(14,'CLOUD'),(14,'ARCHITECTURE'),
(15,'OS'),(15,'DB'),(16,'NETWORK'),(16,'JAVA'),(17,'DB'),(17,'SPRING'),
(18,'JAVA'),(18,'ALGORITHM'),(19,'ALGORITHM'),(19,'DATA_STRUCTURE'),
(20,'ARCHITECTURE'),(20,'CLOUD');

-- ===================== CS Quiz Questions (200 = 20 sessions × 10) =====================
-- Using a repeating pattern: 6 MCQ + 4 SHORT_ANSWER per session
-- Topics cycle through: OS, NETWORK, DB, SPRING, JAVA, DATA_STRUCTURE, ALGORITHM, ARCHITECTURE, CLOUD

INSERT INTO cs_quiz_questions (id, session_id, order_index, topic, difficulty, type, prompt, correct_choice_index, reference_answer, created_at)
SELECT
    x.id,
    ((x.id - 1) / 10) + 1 AS session_id,
    MOD(x.id - 1, 10) AS order_index,
    CASE MOD(x.id, 9)
        WHEN 0 THEN 'OS' WHEN 1 THEN 'NETWORK' WHEN 2 THEN 'DB'
        WHEN 3 THEN 'SPRING' WHEN 4 THEN 'JAVA' WHEN 5 THEN 'DATA_STRUCTURE'
        WHEN 6 THEN 'ALGORITHM' WHEN 7 THEN 'ARCHITECTURE' WHEN 8 THEN 'CLOUD'
    END AS topic,
    'MID' AS difficulty,
    CASE WHEN MOD(x.id - 1, 10) < 6 THEN 'MULTIPLE_CHOICE' ELSE 'SHORT_ANSWER' END AS type,
    CONCAT('시드 문제 #', x.id, ': 이것은 테스트 문제입니다.') AS prompt,
    CASE WHEN MOD(x.id - 1, 10) < 6 THEN 0 ELSE NULL END AS correct_choice_index,
    CONCAT('모범 답안 #', x.id) AS reference_answer,
    CURRENT_TIMESTAMP AS created_at
FROM (SELECT ROWNUM AS id FROM SYSTEM_RANGE(1, 200)) x;

-- Choices for MCQ questions (questions where MOD(id-1,10) < 6 → ids: 1-6, 11-16, 21-26, ...)
INSERT INTO cs_quiz_question_choices (question_id, idx, choice_text)
SELECT q.id, c.idx, CONCAT('선택지 ', c.idx + 1)
FROM cs_quiz_questions q
CROSS JOIN (VALUES (0),(1),(2),(3)) AS c(idx)
WHERE q.type = 'MULTIPLE_CHOICE';

-- Rubric keywords for SHORT_ANSWER questions
INSERT INTO cs_quiz_question_rubric_keywords (question_id, idx, keyword)
SELECT q.id, k.idx, CONCAT('키워드', k.idx + 1)
FROM cs_quiz_questions q
CROSS JOIN (VALUES (0),(1),(2)) AS k(idx)
WHERE q.type = 'SHORT_ANSWER';

-- ===================== CS Quiz Attempts (600 = 200 questions × 3) =====================
INSERT INTO cs_quiz_attempts (id, question_id, answer_text, selected_choice_index, is_correct, suggested_answer, created_at)
SELECT
    x.id,
    ((x.id - 1) / 3) + 1 AS question_id,
    CASE WHEN MOD(((x.id - 1) / 3), 10) >= 6 THEN CONCAT('답변 #', x.id) ELSE NULL END AS answer_text,
    CASE WHEN MOD(((x.id - 1) / 3), 10) < 6 THEN MOD(x.id, 4) ELSE NULL END AS selected_choice_index,
    CASE WHEN MOD(x.id, 3) = 0 THEN TRUE ELSE FALSE END AS is_correct,
    NULL AS suggested_answer,
    CURRENT_TIMESTAMP AS created_at
FROM (SELECT ROWNUM AS id FROM SYSTEM_RANGE(1, 600)) x;

-- Minimal feedback for attempts (1 strength each)
INSERT INTO cs_quiz_feedback_strengths (attempt_id, idx, strength)
SELECT a.id, 0, '핵심 개념을 잘 이해하고 있습니다.'
FROM cs_quiz_attempts a;

-- ===================== Resume Sessions (10) =====================
INSERT INTO resume_sessions (id, member_id, position_type, title, portfolio_url, resume_text, portfolio_text, status, created_at, updated_at) VALUES
(1,  1, 'BE', '백엔드 이력서 분석 1', NULL, '이력서 텍스트 샘플 1', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2,  1, 'FE', '프론트엔드 이력서 분석', NULL, '이력서 텍스트 샘플 2', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3,  1, 'BE', '백엔드 이력서 분석 2', NULL, '이력서 텍스트 샘플 3', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4,  1, 'MOBILE', '모바일 이력서 분석',  NULL, '이력서 텍스트 샘플 4', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5,  1, 'BE', '백엔드 이력서 분석 3', NULL, '이력서 텍스트 샘플 5', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6,  1, 'FE', '프론트엔드 이력서 분석 2', NULL, '이력서 텍스트 샘플 6', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7,  1, 'BE', '백엔드 이력서 분석 4', NULL, '이력서 텍스트 샘플 7', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8,  1, 'MOBILE', '모바일 이력서 분석 2', NULL, '이력서 텍스트 샘플 8', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9,  1, 'FE', '프론트엔드 이력서 분석 3', NULL, '이력서 텍스트 샘플 9', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 1, 'BE', '백엔드 이력서 분석 5', NULL, '이력서 텍스트 샘플 10', NULL, 'QUESTIONS_READY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ===================== Resume Questions (50 = 10 sessions × 5) =====================
INSERT INTO resume_questions (id, session_id, order_index, badge, likelihood, question, intention, keywords, model_answer, created_at)
SELECT
    x.id,
    ((x.id - 1) / 5) + 1 AS session_id,
    MOD(x.id - 1, 5) AS order_index,
    CASE MOD(x.id, 5)
        WHEN 0 THEN 'EXPERIENCE' WHEN 1 THEN 'SKILLS' WHEN 2 THEN 'PROJECT'
        WHEN 3 THEN 'MOTIVATION' WHEN 4 THEN 'CULTURE_FIT'
    END AS badge,
    60 + MOD(x.id * 7, 40) AS likelihood,
    CONCAT('면접 질문 #', x.id, ': 이 프로젝트에서 어떤 역할을 하셨나요?') AS question,
    '지원자의 실무 경험을 파악하기 위한 질문' AS intention,
    'Spring Boot, REST API, JPA' AS keywords,
    CONCAT('모범 답안 #', x.id) AS model_answer,
    CURRENT_TIMESTAMP AS created_at
FROM (SELECT ROWNUM AS id FROM SYSTEM_RANGE(1, 50)) x;

-- ===================== Reset IDENTITY sequences =====================
-- H2 IDENTITY auto-increment must be restarted past the max seeded ID
-- to prevent PK collisions when new rows are inserted at runtime.
ALTER TABLE members ALTER COLUMN id RESTART WITH 100;
ALTER TABLE cs_quiz_sessions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE cs_quiz_questions ALTER COLUMN id RESTART WITH 300;
ALTER TABLE cs_quiz_attempts ALTER COLUMN id RESTART WITH 700;
ALTER TABLE resume_sessions ALTER COLUMN id RESTART WITH 100;
ALTER TABLE resume_questions ALTER COLUMN id RESTART WITH 100;
