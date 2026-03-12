package com.devweb.api.resume.dto;

import com.devweb.domain.resume.model.Resume;

import java.time.LocalDateTime;

public record ResumeResponse(
        Long id,
        String title,
        String fileType,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        String extractStatus,
        LocalDateTime createdAt
) {
    public static ResumeResponse from(Resume resume) {
        var stored = resume.getStoredFile();
        return new ResumeResponse(
                resume.getId(),
                resume.getTitle(),
                resume.getFileType().name(),
                stored != null ? stored.getOriginalFilename() : null,
                stored != null ? stored.getContentType() : null,
                stored != null ? stored.getSizeBytes() : null,
                resume.getExtractStatus().name(),
                resume.getCreatedAt()
        );
    }
}
