package com.devweb.domain.studyquiz.session.model;

public enum CsQuizTopic {
    OS,
    NETWORK,
    DB,
    SPRING,
    JAVA,
    DATA_STRUCTURE,
    ALGORITHM,
    ARCHITECTURE,
    CLOUD;

    public static CsQuizTopic from(String raw) {
        if (raw == null || raw.isBlank()) throw new IllegalArgumentException("topic은 비어 있을 수 없습니다.");
        String normalized = raw.trim().toUpperCase()
                .replace("-", "_")
                .replace(" ", "_");
        try {
            return CsQuizTopic.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("지원하지 않는 topic 입니다. value=" + raw);
        }
    }
}

