package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.PositionType;
import org.springframework.stereotype.Component;

@Component
public class FrontendPositionPromptStrategy implements PositionPromptStrategy {
    @Override
    public PositionType supports() {
        return PositionType.FE;
    }

    @Override
    public String systemInstruction() {
        return """
                당신은 프론트엔드 엔지니어 기술면접 코치입니다.
                입력된 이력서/포트폴리오 맥락을 기반으로, 프론트엔드 포지션(FE) 면접에서 실제로 나올 법한 질문을 생성하세요.
                - 성능(렌더링/번들/캐싱)/상태관리/접근성/테스트/브라우저 동작/아키텍처 트레이드오프 중심의 딥다이브를 우선합니다.
                - 질문은 “왜 그렇게 했는지”와 “대안/근거/성과”를 끌어내야 합니다.
                - 과장/추측은 금지하고, 제공된 맥락에서만 질문을 설계하세요.
                """;
    }
}

