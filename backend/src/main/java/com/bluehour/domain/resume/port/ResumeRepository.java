package com.bluehour.domain.resume.port;

import com.bluehour.domain.resume.model.Resume;

import java.util.List;
import java.util.Optional;

/**
 * Repository Port (DIP)
 */
public interface ResumeRepository {
    Resume save(Resume resume);

    Optional<Resume> findById(Long id);

    List<Resume> findAllByMemberId(Long memberId);

    void delete(Resume resume);
}


