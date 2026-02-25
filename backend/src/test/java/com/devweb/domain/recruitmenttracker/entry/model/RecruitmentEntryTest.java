package com.devweb.domain.recruitmenttracker.entry.model;

import com.devweb.domain.member.model.Member;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.*;

class RecruitmentEntryTest {

    private Member member;

    @BeforeEach
    void setUp() {
        member = new Member("test@example.com");
    }

    // ─────────────────────────────────────────────
    // 생성자 검증
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("정상 생성 - step/platform null이면 기본값 설정")
    void 생성_step_platform_기본값() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);

        assertThat(entry.getStep()).isEqualTo(RecruitmentStep.READY);
        assertThat(entry.getPlatformType()).isEqualTo(PlatformType.MANUAL);
    }

    @Test
    @DisplayName("member가 null이면 IllegalArgumentException")
    void 생성자_member_null_예외() {
        assertThatThrownBy(() -> new RecruitmentEntry(null, "카카오", "백엔드", null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("member");
    }

    @Test
    @DisplayName("companyName이 null이면 IllegalArgumentException")
    void 생성자_companyName_null_예외() {
        assertThatThrownBy(() -> new RecruitmentEntry(member, null, "백엔드", null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("companyName");
    }

    @Test
    @DisplayName("companyName이 blank이면 IllegalArgumentException")
    void 생성자_companyName_blank_예외() {
        assertThatThrownBy(() -> new RecruitmentEntry(member, "  ", "백엔드", null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("companyName");
    }

    @Test
    @DisplayName("position이 null이면 IllegalArgumentException")
    void 생성자_position_null_예외() {
        assertThatThrownBy(() -> new RecruitmentEntry(member, "카카오", null, null, null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("position");
    }

    // ─────────────────────────────────────────────
    // changeStep
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("changeStep으로 상태 변경 성공")
    void changeStep_성공() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", RecruitmentStep.READY, null, null);

        entry.changeStep(RecruitmentStep.APPLIED);

        assertThat(entry.getStep()).isEqualTo(RecruitmentStep.APPLIED);
    }

    @Test
    @DisplayName("changeStep에 null이면 IllegalArgumentException")
    void changeStep_null_예외() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);

        assertThatThrownBy(() -> entry.changeStep(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("step");
    }

    @Test
    @DisplayName("모든 RecruitmentStep으로 변경 가능")
    void changeStep_모든_단계_변경() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);

        for (RecruitmentStep step : RecruitmentStep.values()) {
            entry.changeStep(step);
            assertThat(entry.getStep()).isEqualTo(step);
        }
    }

    // ─────────────────────────────────────────────
    // updateApplicationInfo
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("updateApplicationInfo로 회사명/직급 변경 성공")
    void updateApplicationInfo_성공() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);

        entry.updateApplicationInfo("네이버", "프론트엔드");

        assertThat(entry.getCompanyName()).isEqualTo("네이버");
        assertThat(entry.getPosition()).isEqualTo("프론트엔드");
    }

    @Test
    @DisplayName("updateApplicationInfo에 빈 companyName이면 IllegalArgumentException")
    void updateApplicationInfo_빈_companyName_예외() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);

        assertThatThrownBy(() -> entry.updateApplicationInfo("  ", "프론트엔드"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("companyName");
    }

    @Test
    @DisplayName("updateApplicationInfo에 빈 position이면 IllegalArgumentException")
    void updateApplicationInfo_빈_position_예외() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);

        assertThatThrownBy(() -> entry.updateApplicationInfo("네이버", ""))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("position");
    }

    // ─────────────────────────────────────────────
    // changeAppliedDate
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("changeAppliedDate로 지원일 변경 성공")
    void changeAppliedDate_성공() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);
        LocalDate newDate = LocalDate.of(2025, 1, 15);

        entry.changeAppliedDate(newDate);

        assertThat(entry.getAppliedDate()).isEqualTo(newDate);
    }

    @Test
    @DisplayName("changeAppliedDate에 null이면 IllegalArgumentException")
    void changeAppliedDate_null_예외() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);

        assertThatThrownBy(() -> entry.changeAppliedDate(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("appliedDate");
    }

    // ─────────────────────────────────────────────
    // linkExternal
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("linkExternal로 외부 연동 정보 저장")
    void linkExternal_정상() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, PlatformType.MANUAL, null);

        entry.linkExternal("ext-123", PlatformType.WANTED);

        assertThat(entry.getExternalId()).isEqualTo("ext-123");
        assertThat(entry.getPlatformType()).isEqualTo(PlatformType.WANTED);
    }

    @Test
    @DisplayName("linkExternal에 platformType이 null이면 기존 플랫폼 유지")
    void linkExternal_platform_null이면_기존유지() {
        RecruitmentEntry entry = new RecruitmentEntry(member, "카카오", "백엔드", null, PlatformType.LINKEDIN, null);

        entry.linkExternal("ext-456", null);

        assertThat(entry.getExternalId()).isEqualTo("ext-456");
        assertThat(entry.getPlatformType()).isEqualTo(PlatformType.LINKEDIN); // 기존 값 유지
    }

    // ─────────────────────────────────────────────
    // 생성자 - appliedDate 포함
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("생성 시 appliedDate를 직접 설정 가능")
    void 생성자_appliedDate_설정() {
        LocalDate date = LocalDate.of(2024, 6, 1);
        RecruitmentEntry entry = new RecruitmentEntry(
                member, "카카오", "백엔드",
                RecruitmentStep.APPLIED, PlatformType.WANTED, "ext-001", date
        );

        assertThat(entry.getAppliedDate()).isEqualTo(date);
    }
}
