package com.devweb.domain.resume.session.port;

import com.devweb.domain.resume.session.model.StoredFileRef;

public interface FileStoragePort {
    StoredFileRef save(byte[] bytes, String originalFilename, String contentType);
}

