package com.devweb.domain.resume.session.service;

import com.devweb.domain.resume.session.model.PositionType;

public interface PositionPromptStrategy {
    PositionType supports();

    String systemInstruction();
}

