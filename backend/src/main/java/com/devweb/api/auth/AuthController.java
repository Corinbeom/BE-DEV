package com.devweb.api.auth;

import com.devweb.api.member.dto.MemberResponse;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.infra.auth.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.env.Environment;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final MemberRepository memberRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final Environment environment;

    public AuthController(MemberRepository memberRepository,
                          JwtTokenProvider jwtTokenProvider,
                          Environment environment) {
        this.memberRepository = memberRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.environment = environment;
    }

    @GetMapping("/me")
    public ApiResponse<MemberResponse> me() {
        Long memberId = AuthUtils.currentMemberId();
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        return ApiResponse.success(MemberResponse.from(member));
    }

    /**
     * Dev-only: 시드 유저(memberId=1)의 JWT 토큰 발급.
     * prod 프로필에서는 404 반환.
     */
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

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletResponse response) {
        String cookieHeader = "devweb_token="
                + "; Max-Age=0"
                + "; Path=/"
                + "; HttpOnly"
                + "; Secure"
                + "; SameSite=None";
        response.addHeader("Set-Cookie", cookieHeader);
        return ApiResponse.ok();
    }
}
