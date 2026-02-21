package com.devweb.domain.resume.session.port;

public interface TextExtractorPort {
    String extract(byte[] bytes, String contentType);
}

