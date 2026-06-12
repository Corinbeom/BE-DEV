package com.bluehour.domain.resume.session.port;

import com.bluehour.domain.resume.session.model.StoredFileRef;

public interface FileStoragePort {
    StoredFileRef save(byte[] bytes, String originalFilename, String contentType);

    byte[] load(String storageKey);

    void delete(String storageKey);
}

