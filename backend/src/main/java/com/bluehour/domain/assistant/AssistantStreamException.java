package com.bluehour.domain.assistant;

public class AssistantStreamException extends RuntimeException {

    private final String code;

    public AssistantStreamException(String code, String message) {
        super(message);
        this.code = code;
    }

    public AssistantStreamException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
