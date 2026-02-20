package com.devweb.api.recruitmenttracker.entry;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.recruitmenttracker.entry.model.PlatformType;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentStep;
import com.devweb.domain.recruitmenttracker.entry.port.RecruitmentEntryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@Transactional
public class RecruitmentEntryService {

    private final RecruitmentEntryRepository recruitmentEntryRepository;
    private final MemberRepository memberRepository;

    public RecruitmentEntryService(
            RecruitmentEntryRepository recruitmentEntryRepository,
            MemberRepository memberRepository
    ) {
        this.recruitmentEntryRepository = recruitmentEntryRepository;
        this.memberRepository = memberRepository;
    }

    public RecruitmentEntry create(
            Long memberId,
            String companyName,
            String position,
            RecruitmentStep step,
            PlatformType platformType,
            String externalId,
            LocalDate appliedDate
    ) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));

        RecruitmentEntry entry = new RecruitmentEntry(member, companyName, position, step, platformType, externalId, appliedDate);
        return recruitmentEntryRepository.save(entry);
    }

    @Transactional(readOnly = true)
    public RecruitmentEntry get(Long id) {
        return recruitmentEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("RecruitmentEntry를 찾을 수 없습니다. id=" + id));
    }

    @Transactional(readOnly = true)
    public List<RecruitmentEntry> listByMember(Long memberId) {
        return recruitmentEntryRepository.findAllByMemberId(memberId);
    }

    public RecruitmentEntry update(
            Long id,
            String companyName,
            String position,
            RecruitmentStep step,
            PlatformType platformType,
            String externalId,
            LocalDate appliedDate
    ) {
        RecruitmentEntry entry = get(id);
        entry.updateApplicationInfo(companyName, position);
        if (step != null) entry.changeStep(step);
        if (externalId != null || platformType != null) {
            entry.linkExternal(externalId, platformType);
        }
        if (appliedDate != null) entry.changeAppliedDate(appliedDate);
        return entry;
    }

    public RecruitmentEntry changeStep(Long id, RecruitmentStep step) {
        RecruitmentEntry entry = get(id);
        entry.changeStep(step);
        return entry;
    }

    public void delete(Long id) {
        RecruitmentEntry entry = get(id);
        recruitmentEntryRepository.delete(entry);
    }
}


