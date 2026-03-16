package com.devweb.api.config;

import com.devweb.common.RequestLoggingFilter;
import com.devweb.infra.auth.DevWebOAuth2UserService;
import com.devweb.infra.auth.DevWebOidcUserService;
import com.devweb.infra.auth.JwtAuthenticationFilter;
import com.devweb.infra.auth.JwtTokenProvider;
import com.devweb.infra.auth.OAuth2LoginSuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.frameoptions.XFrameOptionsHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;
    private final DevWebOAuth2UserService oAuth2UserService;
    private final DevWebOidcUserService oidcUserService;
    private final OAuth2LoginSuccessHandler successHandler;
    private final RequestLoggingFilter requestLoggingFilter;
    private final String frontendUrl;

    public SecurityConfig(JwtTokenProvider jwtTokenProvider,
                          DevWebOAuth2UserService oAuth2UserService,
                          DevWebOidcUserService oidcUserService,
                          OAuth2LoginSuccessHandler successHandler,
                          RequestLoggingFilter requestLoggingFilter,
                          @Value("${devweb.frontend-url}") String frontendUrl) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.oAuth2UserService = oAuth2UserService;
        this.oidcUserService = oidcUserService;
        this.successHandler = successHandler;
        this.requestLoggingFilter = requestLoggingFilter;
        this.frontendUrl = frontendUrl;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers
                .addHeaderWriter(new XFrameOptionsHeaderWriter(
                    XFrameOptionsHeaderWriter.XFrameOptionsMode.SAMEORIGIN))
            )
            // OAuth2 인가 코드 플로우는 세션에 state를 저장해야 하므로 IF_REQUIRED 사용
            // API 인증은 JWT 쿠키로 처리하므로 실질적으로는 Stateless
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/oauth2/**",
                    "/login/oauth2/**",
                    "/api/auth/**",
                    "/h2-console/**",
                    "/actuator/**",
                    "/error"
                ).permitAll()
                .requestMatchers(HttpMethod.POST, "/api/members").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/members/**").permitAll()
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(oAuth2UserService)      // Kakao (OAuth2)
                    .oidcUserService(oidcUserService))   // Google (OIDC)
                .successHandler(successHandler)
            )
            .addFilterBefore(requestLoggingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(
                new JwtAuthenticationFilter(jwtTokenProvider),
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
                frontendUrl,
                "https://*.vercel.app",
                "http://localhost:*",
                "http://127.0.0.1:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
