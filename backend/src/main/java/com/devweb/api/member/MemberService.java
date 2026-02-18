package com.devweb.api.member;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;

    public MemberService(MemberRepository memberRepository) {
        this.memberRepository = memberRepository;
    }

    public Member create(String email) {
        return memberRepository.save(new Member(email));
    }

    @Transactional(readOnly = true)
    public Member get(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + id));
    }
}


