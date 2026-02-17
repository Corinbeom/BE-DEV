package com.devweb.infra.persistence.resume;

import com.devweb.domain.resume.model.Resume;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SpringDataResumeJpaRepository extends JpaRepository<Resume, Long> {
    List<Resume> findAllByMemberId(Long memberId);
}


