package com.devweb.domain.resume.session.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class StoredFileRef {

    @Column(name = "storage_key", length = 500)
    private String storageKey;

    @Column(name = "original_filename", length = 300)
    private String originalFilename;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    protected StoredFileRef() {
    }

    public StoredFileRef(String storageKey, String originalFilename, String contentType, Long sizeBytes) {
        if (storageKey == null || storageKey.isBlank()) throw new IllegalArgumentException("storageKey는 필수입니다.");
        this.storageKey = storageKey;
        this.originalFilename = originalFilename;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public String getContentType() {
        return contentType;
    }

    public Long getSizeBytes() {
        return sizeBytes;
    }
}

