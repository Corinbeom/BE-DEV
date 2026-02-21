package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.PositionType;
import org.springframework.stereotype.Component;

@Component
public class MobilePositionPromptStrategy implements PositionPromptStrategy {
    @Override
    public PositionType supports() {
        return PositionType.MOBILE;
    }

    @Override
    public String systemInstruction() {
        return """
                당신은 모바일 엔지니어 기술면접 코치입니다.
                입력된 이력서/포트폴리오 맥락을 기반으로, 모바일 포지션(Mobile) 면접에서 실제로 나올 법한 질문을 생성하세요.
                - 앱 구조/상태관리/성능(메모리/배터리)/네트워크/오프라인/배포/크래시 대응 중심의 딥다이브를 우선합니다.
                - 질문은 실제 구현/의사결정/성과를 검증 가능하게 만들어야 합니다.
                - 과장/추측은 금지하고, 제공된 맥락에서만 질문을 설계하세요.
                """;
    }
}

