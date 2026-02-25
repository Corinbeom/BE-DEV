package com.devweb.domain.studyquiz.session.model;

public enum CsQuizDifficulty {
    LOW,
    MID,
    HIGH;

    public static CsQuizDifficulty from(String raw) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("difficulty는 필수입니다.");
        try {
            return CsQuizDifficulty.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("지원하지 않는 difficulty 입니다. value=" + raw + " (LOW/MID/HIGH)");
        }
    }
}

