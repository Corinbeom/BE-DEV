package com.devweb.api.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        String cookieSchemeName = "devweb_token";

        return new OpenAPI()
                .info(new Info()
                        .title("Bluehour API")
                        .description("Before Your Sunrise — AI 기반 이력서 분석, CS 퀴즈, 지원 현황 관리 API")
                        .version("1.0.0"))
                .addSecurityItem(new SecurityRequirement().addList(cookieSchemeName))
                .schemaRequirement(cookieSchemeName, new SecurityScheme()
                        .name(cookieSchemeName)
                        .type(SecurityScheme.Type.APIKEY)
                        .in(SecurityScheme.In.COOKIE)
                        .description("JWT 인증 쿠키 (httpOnly)"));
    }
}
