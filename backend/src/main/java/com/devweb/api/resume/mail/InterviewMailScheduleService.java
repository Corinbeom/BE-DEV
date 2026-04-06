package com.devweb.api.resume.mail;

import com.devweb.api.resume.mail.dto.InterviewMailScheduleResponse;
import com.devweb.api.resume.mail.dto.UpsertInterviewMailScheduleRequest;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import com.devweb.domain.resume.mail.port.InterviewMailScheduleRepository;
import com.devweb.domain.resume.model.Resume;
import com.devweb.domain.resume.port.ResumeRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.event.EventListener;
import com.devweb.domain.member.event.MemberDeletedEvent;

import java.util.Optional;

@Component
public class InterviewMailScheduleService {

    private final InterviewMailScheduleRepository scheduleRepository;
    private final MemberRepository memberRepository;
    private final ResumeRepository resumeRepository;

    public InterviewMailScheduleService(InterviewMailScheduleRepository scheduleRepository,
                                         MemberRepository memberRepository,
                                         ResumeRepository resumeRepository) {
        this.scheduleRepository = scheduleRepository;
        this.memberRepository = memberRepository;
        this.resumeRepository = resumeRepository;
    }

    @Transactional(readOnly = true)
    public Optional<InterviewMailScheduleResponse> getByMemberId(Long memberId) {
        return scheduleRepository.findByMemberId(memberId)
                .map(InterviewMailScheduleResponse::from);
    }

    @Transactional
    public InterviewMailScheduleResponse upsert(Long memberId, UpsertInterviewMailScheduleRequest request) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Resume resume = resumeRepository.findById(request.resumeId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 이력서입니다."));

        if (!resume.getMember().getId().equals(memberId)) {
            throw new IllegalArgumentException("본인의 이력서만 설정할 수 있습니다.");
        }

        String positionType = request.positionType().trim().toUpperCase();

        Optional<InterviewMailSchedule> existing = scheduleRepository.findByMemberId(memberId);

        InterviewMailSchedule schedule;
        if (existing.isPresent()) {
            schedule = existing.get();
            schedule.update(resume, positionType, request.sendHour(), request.enabled(), request.targetTechnologies());
        } else {
            schedule = new InterviewMailSchedule(member, resume, positionType,
                    request.sendHour(), request.enabled(), request.targetTechnologies());
        }

        schedule = scheduleRepository.save(schedule);
        return InterviewMailScheduleResponse.from(schedule);
    }

    @Transactional
    public void delete(Long memberId) {
        InterviewMailSchedule schedule = scheduleRepository.findByMemberId(memberId)
                .orElseThrow(() -> new IllegalArgumentException("설정된 스케줄이 없습니다."));
        scheduleRepository.delete(schedule);
    }

    @EventListener
    public void onMemberDeleted(MemberDeletedEvent event) {
        scheduleRepository.findByMemberId(event.memberId()).ifPresent(scheduleRepository::delete);
    }
}
