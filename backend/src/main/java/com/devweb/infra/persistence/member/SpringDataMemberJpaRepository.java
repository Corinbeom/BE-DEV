package com.devweb.infra.persistence.member;

import com.devweb.domain.member.model.Member;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringDataMemberJpaRepository extends JpaRepository<Member, Long> {
}


