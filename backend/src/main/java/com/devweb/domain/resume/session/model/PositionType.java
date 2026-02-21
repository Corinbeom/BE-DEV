package com.devweb.domain.resume.session.model;

public enum PositionType {
    BE,
    FE,
    MOBILE;

    public static PositionType from(String raw) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("positionType은 필수입니다.");
        return PositionType.valueOf(raw.trim().toUpperCase());
    }
}

