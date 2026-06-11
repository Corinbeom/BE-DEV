ALTER TABLE members ADD COLUMN IF NOT EXISTS target_roles TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE members SET onboarding_completed = TRUE;
