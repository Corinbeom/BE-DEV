package com.devweb.common;

public class UpstreamRateLimitException extends IllegalStateException {

    private final int retryAfterSeconds;

    public UpstreamRateLimitException(String message, int retryAfterSeconds) {
        super(message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}

