package com.devweb.api.recruitmenttracker.entry;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.recruitmenttracker.entry.model.PlatformType;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentStep;
import com.devweb.domain.recruitmenttracker.entry.port.RecruitmentEntryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class RecruitmentEntryServiceTest {

    @Mock RecruitmentEntryRepository entryRepository;
    @Mock MemberRepository memberRepository;

    @InjectMocks RecruitmentEntryService sut;

    private Member member;

    @BeforeEach
    void setUp() {
        member = new Member("test@example.com");
    }

    // ─────────────────────────────────────────────
    // create
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("지원 건 생성 성공")
    void create_성공() {
        // given
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(entryRepository.save(any(RecruitmentEntry.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        RecruitmentEntry result = sut.create(
                1L, "카카오", "백엔드", RecruitmentStep.APPLIED,
                PlatformType.WANTED, null, LocalDate.of(2025, 1, 1)
        );

        // then
        assertThat(result.getCompanyName()).isEqualTo("카카오");
        assertThat(result.getPosition()).isEqualTo("백엔드");
        assertThat(result.getStep()).isEqualTo(RecruitmentStep.APPLIED);
        assertThat(result.getPlatformType()).isEqualTo(PlatformType.WANTED);
    }

    @Test
    @DisplayName("존재하지 않는 멤버로 생성 시 ResourceNotFoundException")
    void create_존재하지않는_멤버_예외() {
        given(memberRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.create(
                99L, "카카오", "백엔드", null, null, null, null
        )).isInstanceOf(ResourceNotFoundException.class)
          .hasMessageContaining("99");
    }

    // ─────────────────────────────────────────────
    // get
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("지원 건 조회 성공")
    void get_성공() {
        // given
        RecruitmentEntry entry = new RecruitmentEntry(member, "네이버", "프론트엔드", null, null, null);
        given(entryRepository.findById(1L)).willReturn(Optional.of(entry));

        // when
        RecruitmentEntry result = sut.get(1L);

        // then
        assertThat(result.getCompanyName()).isEqualTo("네이버");
    }

    @Test
    @DisplayName("존재하지 않는 ID 조회 시 ResourceNotFoundException")
    void get_없으면_예외() {
        given(entryRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.get(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─────────────────────────────────────────────
    // listByMember
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("멤버별 지원 목록 조회 성공")
    void listByMember_성공() {
        // given
        List<RecruitmentEntry> entries = List.of(
                new RecruitmentEntry(member, "카카오", "백엔드", null, null, null),
                new RecruitmentEntry(member, "네이버", "프론트엔드", null, null, null)
        );
        given(entryRepository.findAllByMemberId(1L)).willReturn(entries);

        // when
        List<RecruitmentEntry> result = sut.listByMember(1L);

        // then
        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("지원 건이 없으면 빈 리스트 반환")
    void listByMember_빈리스트() {
        given(entryRepository.findAllByMemberId(1L)).willReturn(List.of());

        List<RecruitmentEntry> result = sut.listByMember(1L);

        assertThat(result).isEmpty();
    }

    // ─────────────────────────────────────────────
    // changeStep
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("지원 단계 변경 성공")
    void changeStep_성공() {
        // given
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", RecruitmentStep.READY, null, null);
        given(entryRepository.findById(1L)).willReturn(Optional.of(entry));

        // when
        RecruitmentEntry result = sut.changeStep(1L, RecruitmentStep.INTERVIEWING);

        // then
        assertThat(result.getStep()).isEqualTo(RecruitmentStep.INTERVIEWING);
    }

    @Test
    @DisplayName("존재하지 않는 지원 건 단계 변경 시 ResourceNotFoundException")
    void changeStep_없는_entry_예외() {
        given(entryRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.changeStep(99L, RecruitmentStep.OFFERED))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─────────────────────────────────────────────
    // update
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("지원 건 정보 업데이트 성공")
    void update_성공() {
        // given
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", RecruitmentStep.READY, null, null);
        given(entryRepository.findById(1L)).willReturn(Optional.of(entry));

        // when
        RecruitmentEntry result = sut.update(
                1L, "네이버", "프론트엔드",
                RecruitmentStep.APPLIED, PlatformType.LINKEDIN,
                "ext-001", LocalDate.of(2025, 3, 1)
        );

        // then
        assertThat(result.getCompanyName()).isEqualTo("네이버");
        assertThat(result.getPosition()).isEqualTo("프론트엔드");
        assertThat(result.getStep()).isEqualTo(RecruitmentStep.APPLIED);
        assertThat(result.getPlatformType()).isEqualTo(PlatformType.LINKEDIN);
        assertThat(result.getExternalId()).isEqualTo("ext-001");
    }

    // ─────────────────────────────────────────────
    // delete
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("지원 건 삭제 성공")
    void delete_성공() {
        // given
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);
        given(entryRepository.findById(1L)).willReturn(Optional.of(entry));

        // when
        sut.delete(1L);

        // then
        then(entryRepository).should().delete(entry);
    }

    @Test
    @DisplayName("존재하지 않는 지원 건 삭제 시 ResourceNotFoundException")
    void delete_없는_entry_예외() {
        given(entryRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
