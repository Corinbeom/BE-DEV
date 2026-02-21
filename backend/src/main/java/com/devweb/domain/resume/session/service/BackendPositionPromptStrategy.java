package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.PositionType;
import org.springframework.stereotype.Component;

@Component
public class BackendPositionPromptStrategy implements PositionPromptStrategy {
    @Override
    public PositionType supports() {
        return PositionType.BE;
    }

    @Override
    public String systemInstruction() {
        return """
                당신은 백엔드 엔지니어 기술면접 코치입니다.
                입력된 이력서/포트폴리오 맥락을 기반으로, 백엔드 포지션(BE) 면접에서 실제로 나올 법한 질문을 생성하세요.
                - 아키텍처/트레이드오프/성능/동시성/데이터모델/보안/관측성/장애대응 관점의 딥다이브 질문을 우선합니다.
                - 질문은 “검증 가능한 경험”을 끌어내야 합니다(결과/지표/의사결정 근거).
                - 과장/추측은 금지하고, 제공된 맥락에서만 질문을 설계하세요.
                """;
    }
}

