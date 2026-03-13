package com.devweb.common;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    GlobalExceptionHandler sut;

    @BeforeEach
    void setUp() {
        sut = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("ResourceNotFoundException → 404 NOT_FOUND")
    void handleNotFound() {
        var ex = new ResourceNotFoundException("Member not found: 99");

        ResponseEntity<ApiResponse<Void>> result = sut.handleNotFound(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(result.getBody()).isNotNull();
        assertThat(result.getBody().success()).isFalse();
        assertThat(result.getBody().error().code()).isEqualTo("NOT_FOUND");
        assertThat(result.getBody().error().message()).contains("99");
    }

    @Test
    @DisplayName("UnauthorizedException → 401 UNAUTHORIZED")
    void handleUnauthorized() {
        var ex = new UnauthorizedException("인증이 필요합니다.");

        ResponseEntity<ApiResponse<Void>> result = sut.handleUnauthorized(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(result.getBody().error().code()).isEqualTo("UNAUTHORIZED");
    }

    @Test
    @DisplayName("IllegalArgumentException → 400 BAD_REQUEST")
    void handleIllegalArgument() {
        var ex = new IllegalArgumentException("잘못된 인자");

        ResponseEntity<ApiResponse<Void>> result = sut.handleIllegalArgument(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(result.getBody().error().code()).isEqualTo("BAD_REQUEST");
    }

    @Test
    @DisplayName("MethodArgumentNotValidException → 400 VALIDATION_ERROR")
    void handleValidation() throws Exception {
        var bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "email", null, false,
                null, null, "must not be blank"));

        var param = new MethodParameter(
                this.getClass().getDeclaredMethod("handleValidation"), -1);
        var ex = new MethodArgumentNotValidException(param, bindingResult);

        ResponseEntity<ApiResponse<Void>> result = sut.handleValidation(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(result.getBody().error().code()).isEqualTo("VALIDATION_ERROR");
        assertThat(result.getBody().error().message()).contains("email");
    }

    @Test
    @DisplayName("MaxUploadSizeExceededException → 413 PAYLOAD_TOO_LARGE")
    void handleMaxUpload() {
        var ex = new MaxUploadSizeExceededException(10_000_000);

        ResponseEntity<ApiResponse<Void>> result = sut.handleMaxUpload(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.PAYLOAD_TOO_LARGE);
        assertThat(result.getBody().error().code()).isEqualTo("PAYLOAD_TOO_LARGE");
    }

    @Test
    @DisplayName("UpstreamRateLimitException → 429 RATE_LIMITED + Retry-After 헤더")
    void handleUpstreamRateLimit() {
        var ex = new UpstreamRateLimitException("요청 제한 초과", 30);

        ResponseEntity<ApiResponse<Void>> result = sut.handleUpstreamRateLimit(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        assertThat(result.getBody().error().code()).isEqualTo("RATE_LIMITED");
        assertThat(result.getHeaders().getFirst("Retry-After")).isEqualTo("30");
    }

    @Test
    @DisplayName("IllegalStateException → 502 UPSTREAM_ERROR")
    void handleIllegalState() {
        var ex = new IllegalStateException("외부 서비스 실패");

        ResponseEntity<ApiResponse<Void>> result = sut.handleIllegalState(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(result.getBody().error().code()).isEqualTo("UPSTREAM_ERROR");
    }

    @Test
    @DisplayName("Exception (catch-all) → 500 INTERNAL_ERROR")
    void handleUnexpected() {
        var ex = new RuntimeException("unknown error");

        ResponseEntity<ApiResponse<Void>> result = sut.handleUnexpected(ex);

        assertThat(result.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(result.getBody().error().code()).isEqualTo("INTERNAL_ERROR");
    }
}
