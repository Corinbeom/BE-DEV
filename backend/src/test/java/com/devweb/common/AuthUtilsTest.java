package com.devweb.common;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthUtilsTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("인증 있음 → memberId 반환")
    void currentMemberId_인증_있음() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(1L, null, List.of())
        );

        assertThat(AuthUtils.currentMemberId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("인증 없음 → UnauthorizedException")
    void currentMemberId_인증_없음() {
        SecurityContextHolder.clearContext();

        assertThatThrownBy(AuthUtils::currentMemberId)
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("인증이 필요합니다");
    }

    @Test
    @DisplayName("Principal 타입 불일치 → UnauthorizedException")
    void currentMemberId_타입_불일치() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("stringPrincipal", null, List.of())
        );

        assertThatThrownBy(AuthUtils::currentMemberId)
                .isInstanceOf(UnauthorizedException.class);
    }
}
