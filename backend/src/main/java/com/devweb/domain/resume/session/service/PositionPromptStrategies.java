package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.PositionType;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;

@Component
public class PositionPromptStrategies {

    private final EnumMap<PositionType, PositionPromptStrategy> strategies = new EnumMap<>(PositionType.class);

    public PositionPromptStrategies(List<PositionPromptStrategy> discovered) {
        for (PositionPromptStrategy s : discovered) {
            strategies.put(s.supports(), s);
        }
    }

    public String systemInstructionFor(PositionType positionType) {
        PositionPromptStrategy strategy = strategies.get(positionType);
        if (strategy == null) throw new IllegalArgumentException("지원하지 않는 positionType 입니다: " + positionType);
        return strategy.systemInstruction();
    }
}

