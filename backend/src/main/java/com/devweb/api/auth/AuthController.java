package com.devweb.api.auth;

import com.devweb.api.member.dto.MemberResponse;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.infra.auth.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.*;

@Tag(name = "인증", description = "OAuth2 로그인, JWT 토큰, 로그아웃")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final MemberRepository memberRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final Environment environment;
    private final String cookieDomain;

    public AuthController(MemberRepository memberRepository,
                          JwtTokenProvider jwtTokenProvider,
                          Environment environment,
                          @org.springframework.beans.factory.annotation.Value("${devweb.cookie-domain:}") String cookieDomain) {
        this.memberRepository = memberRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.environment = environment;
        this.cookieDomain = cookieDomain;
    }

    @Operation(summary = "현재 사용자 조회", description = "JWT 쿠키 기반으로 로그인된 사용자 정보를 반환합니다.")
    @GetMapping("/me")
    public ApiResponse<MemberResponse> me() {
        Long memberId = AuthUtils.currentMemberId();
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        return ApiResponse.success(MemberResponse.from(member));
    }

    @Operation(summary = "개발용 토큰 발급", description = "시드 유저(memberId=1)의 JWT 토큰을 발급합니다. prod 환경에서는 사용 불가.")
    @PostMapping("/dev-token")
    public ApiResponse<String> devToken() {
        for (String profile : environment.getActiveProfiles()) {
            if ("prod".equals(profile)) {
                throw new IllegalStateException("dev-token은 prod 환경에서 사용할 수 없습니다.");
            }
        }
        Member member = memberRepository.findById(1L)
                .orElseThrow(() -> new ResourceNotFoundException("Seed member(id=1) not found"));
        String token = jwtTokenProvider.generateToken(member.getId());
        return ApiResponse.success(token);
    }

    @Operation(summary = "로그아웃", description = "JWT 쿠키를 삭제하여 로그아웃합니다.")
    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse response) {
        StringBuilder cookie = new StringBuilder("devweb_token=")
                .append("; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None");
        if (cookieDomain != null && !cookieDomain.isBlank()) {
            cookie.append("; Domain=").append(cookieDomain);
        }
        response.addHeader("Set-Cookie", cookie.toString());
        return ApiResponse.ok();
    }
}
