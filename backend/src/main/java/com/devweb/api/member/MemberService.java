package com.devweb.api.member;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.devweb.domain.member.event.MemberDeletedEvent;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

@Service
@Transactional
public class MemberService {

    private final MemberRepository memberRepository;
    private final ApplicationEventPublisher eventPublisher;

    public MemberService(MemberRepository memberRepository, ApplicationEventPublisher eventPublisher) {
        this.memberRepository = memberRepository;
        this.eventPublisher = eventPublisher;
    }

    public Member create(String email) {
        return memberRepository.save(new Member(email));
    }

    @Transactional(readOnly = true)
    public Member get(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + id));
    }

    public void delete(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + id));
                
        eventPublisher.publishEvent(new MemberDeletedEvent(member.getId()));
        memberRepository.delete(member);
    }

    public Member updateTargetRoles(Long memberId, List<String> targetRoles) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));
        member.completeOnboarding(normalizeTargetRoles(targetRoles));
        return memberRepository.save(member);
    }

    private List<String> normalizeTargetRoles(List<String> targetRoles) {
        LinkedHashSet<String> normalized = new LinkedHashSet<>();
        if (targetRoles != null) {
            for (String role : targetRoles) {
                if (role == null) continue;
                String trimmed = role.trim().replaceAll("\\s+", " ");
                if (trimmed.isBlank()) continue;
                if (trimmed.length() > 100) {
                    throw new IllegalArgumentException("관심 직무는 100자 이하로 입력해 주세요.");
                }
                normalized.add(trimmed);
            }
        }
        if (normalized.size() > 3) {
            throw new IllegalArgumentException("관심 직무는 최대 3개까지 선택할 수 있습니다.");
        }
        return new ArrayList<>(normalized);
    }
}

