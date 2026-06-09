-- Phase 7 카메라 행동분석 제거 후 남은 컬럼 정리
-- IF EXISTS: PostgreSQL 9.0+ 지원, 재실행 안전

ALTER TABLE IF EXISTS speech_interview_answers DROP COLUMN IF EXISTS eye_contact_ratio;
ALTER TABLE IF EXISTS speech_interview_answers DROP COLUMN IF EXISTS posture_stability;
ALTER TABLE IF EXISTS speech_interview_answers DROP COLUMN IF EXISTS expression_variety;
ALTER TABLE IF EXISTS speech_interview_answers DROP COLUMN IF EXISTS fidgeting_score;
ALTER TABLE IF EXISTS speech_interview_sessions DROP COLUMN IF EXISTS use_camera;
