package com.devweb.infra.storage.local;

import com.devweb.domain.resume.session.model.StoredFileRef;
import com.devweb.domain.resume.session.port.FileStoragePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Component
@Profile("!prod")
public class LocalFileStorageAdapter implements FileStoragePort {

    private final Path baseDir;

    public LocalFileStorageAdapter(@Value("${devweb.storage.local.base-dir:storage}") String baseDir) {
        this.baseDir = Paths.get(baseDir).toAbsolutePath().normalize();
    }

    @Override
    public StoredFileRef save(byte[] bytes, String originalFilename, String contentType) {
        if (bytes == null || bytes.length == 0) throw new IllegalArgumentException("bytes는 필수입니다.");

        String safeName = originalFilename == null ? "file" : originalFilename.replaceAll("[\\\\/]", "_");
        String ext = "";
        int dot = safeName.lastIndexOf('.');
        if (dot >= 0 && dot < safeName.length() - 1) ext = safeName.substring(dot);

        String key = "resume/" + UUID.randomUUID() + ext;
        Path target = baseDir.resolve(key).normalize();

        try {
            Files.createDirectories(target.getParent());
            Files.write(target, bytes);
        } catch (IOException e) {
            throw new IllegalStateException("파일 저장에 실패했습니다.", e);
        }

        return new StoredFileRef(key, originalFilename, contentType, (long) bytes.length);
    }

    @Override
    public void delete(String storageKey) {
        if (storageKey == null || storageKey.isBlank()) return;
        try {
            Path target = baseDir.resolve(storageKey).normalize();
            Files.deleteIfExists(target);
        } catch (IOException e) {
            // 파일 삭제 실패는 DB 삭제를 롤백할 정도는 아님 — 로그만 남김
            System.err.println("파일 삭제 실패: " + storageKey + " — " + e.getMessage());
        }
    }
}

