package com.devweb.infra.persistence.resume;

import com.devweb.domain.resume.model.Resume;
import com.devweb.domain.resume.port.ResumeRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ResumeRepositoryAdapter implements ResumeRepository {

    private final SpringDataResumeJpaRepository jpaRepository;

    public ResumeRepositoryAdapter(SpringDataResumeJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Resume save(Resume resume) {
        return jpaRepository.save(resume);
    }

    @Override
    public Optional<Resume> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<Resume> findAllByMemberId(Long memberId) {
        return jpaRepository.findAllByMemberId(memberId);
    }

    @Override
    public void delete(Resume resume) {
        jpaRepository.delete(resume);
    }
}


