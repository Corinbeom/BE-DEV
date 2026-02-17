package com.devweb.infra.persistence.member;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class MemberRepositoryAdapter implements MemberRepository {

    private final SpringDataMemberJpaRepository jpaRepository;

    public MemberRepositoryAdapter(SpringDataMemberJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Member save(Member member) {
        return jpaRepository.save(member);
    }

    @Override
    public Optional<Member> findById(Long id) {
        return jpaRepository.findById(id);
    }
}


