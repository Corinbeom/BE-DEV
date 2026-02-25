package com.devweb.common;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail("NOT_FOUND", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest()
                .body(ApiResponse.fail("VALIDATION_ERROR", message));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException e) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.fail("VALIDATION_ERROR", e.getMessage()));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.badRequest()
                .body(ApiResponse.fail("BAD_REQUEST", e.getMessage()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxUpload(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.fail("PAYLOAD_TOO_LARGE", "업로드 파일 크기가 너무 큽니다."));
    }

    /**
     * 외부 시스템(예: LLM API) 호출 실패 등, 애플리케이션 내부의 상태가 아닌 경우를 위한 핸들러.
     */
    @ExceptionHandler(UpstreamRateLimitException.class)
    public ResponseEntity<ApiResponse<Void>> handleUpstreamRateLimit(UpstreamRateLimitException e) {
        log.warn("UpstreamRateLimitException", e);
        String msg = e.getMessage();
        if (msg != null && msg.length() > 2000) msg = msg.substring(0, 2000) + "...";
        ResponseEntity.BodyBuilder builder = ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS);
        if (e.getRetryAfterSeconds() > 0) {
            builder.header("Retry-After", String.valueOf(e.getRetryAfterSeconds()));
        }
        return builder.body(ApiResponse.fail("RATE_LIMITED", msg == null ? "외부 서비스 요청이 제한되었습니다." : msg));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalState(IllegalStateException e) {
        log.error("IllegalStateException", e);
        String msg = e.getMessage();
        if (msg != null && msg.length() > 2000) msg = msg.substring(0, 2000) + "...";
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiResponse.fail("UPSTREAM_ERROR", msg == null ? "외부 서비스 호출에 실패했습니다." : msg));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception e) {
        log.error("Unexpected exception", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail("INTERNAL_ERROR", "예상치 못한 오류가 발생했습니다."));
    }

    private String formatFieldError(FieldError fe) {
        String field = fe.getField();
        String msg = fe.getDefaultMessage();
        Object rejected = fe.getRejectedValue();
        if (rejected == null) {
            return field + ": " + msg;
        }
        return field + ": " + msg + " (rejected=" + rejected + ")";
    }
}


