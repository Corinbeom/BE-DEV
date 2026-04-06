package com.devweb.domain.resume.session.model;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.model.InterviewQuestion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class ResumeSessionTest {

    private Member member;

    @BeforeEach
    void setUp() {
        member = new Member("test@example.com");
    }

    // ─────────────────────────────────────────────
    // 초기 상태
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("생성 직후 상태는 CREATED")
    void 초기_상태는_CREATED() {
        ResumeSession session = new ResumeSession(member, "BE", "테스트", null);
        assertThat(session.getStatus()).isEqualTo(ResumeSessionStatus.CREATED);
        assertThat(session.getResumeFile()).isNull();
        assertThat(session.getQuestions()).isEmpty();
    }

    @Test
    @DisplayName("생성자에서 member가 null이면 IllegalArgumentException")
    void 생성자_member_null_예외() {
        assertThatThrownBy(() -> new ResumeSession(null, "BE", "테스트", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("member");
    }

    @Test
    @DisplayName("생성자에서 title이 blank이면 IllegalArgumentException")
    void 생성자_title_blank_예외() {
        assertThatThrownBy(() -> new ResumeSession(member, "BE", "  ", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("title");
    }

    // ─────────────────────────────────────────────
    // 상태 전이
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("attachFiles + markExtracted 후 상태는 EXTRACTED")
    void markExtracted_후_상태_EXTRACTED() {
        ResumeSession session = new ResumeSession(member, "FE", "테스트", null);

        StoredFileRef resumeRef = new StoredFileRef("key/test.pdf", "test.pdf", "application/pdf", 100L);
        session.attachFiles(resumeRef, null);
        session.markExtracted("이력서 텍스트", null);

        assertThat(session.getStatus()).isEqualTo(ResumeSessionStatus.EXTRACTED);
        assertThat(session.getResumeText()).isEqualTo("이력서 텍스트");
        assertThat(session.getPortfolioText()).isNull();
    }

    @Test
    @DisplayName("markQuestionsReady 후 상태는 QUESTIONS_READY")
    void markQuestionsReady_후_상태_QUESTIONS_READY() {
        ResumeSession session = new ResumeSession(member, "BE", "테스트", null);
        StoredFileRef resumeRef = new StoredFileRef("key/test.pdf", "test.pdf", "application/pdf", 100L);
        session.attachFiles(resumeRef, null);
        session.markExtracted("이력서 텍스트", null);

        List<ResumeQuestion> questions = List.of(dummyQuestion());
        session.markQuestionsReady(questions);

        assertThat(session.getStatus()).isEqualTo(ResumeSessionStatus.QUESTIONS_READY);
        assertThat(session.getQuestions()).hasSize(1);
    }

    @Test
    @DisplayName("markFailed 후 상태는 FAILED")
    void markFailed_후_상태_FAILED() {
        ResumeSession session = new ResumeSession(member, "MOBILE", "테스트", null);
        session.markFailed();
        assertThat(session.getStatus()).isEqualTo(ResumeSessionStatus.FAILED);
    }

    @Test
    @DisplayName("attachFiles에서 resumeFile이 null이면 IllegalArgumentException")
    void attachFiles_resumeFile_null_예외() {
        ResumeSession session = new ResumeSession(member, "BE", "테스트", null);
        assertThatThrownBy(() -> session.attachFiles(null, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("resumeFile");
    }

    @Test
    @DisplayName("markExtracted에서 resumeText가 blank이면 IllegalArgumentException")
    void markExtracted_빈_resumeText_예외() {
        ResumeSession session = new ResumeSession(member, "BE", "테스트", null);
        StoredFileRef ref = new StoredFileRef("key", "file.pdf", "application/pdf", 100L);
        session.attachFiles(ref, null);

        assertThatThrownBy(() -> session.markExtracted("  ", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("resumeText");
    }

    @Test
    @DisplayName("markQuestionsReady에서 빈 questions 리스트면 IllegalArgumentException")
    void markQuestionsReady_빈_questions_예외() {
        ResumeSession session = new ResumeSession(member, "BE", "테스트", null);
        StoredFileRef ref = new StoredFileRef("key", "file.pdf", "application/pdf", 100L);
        session.attachFiles(ref, null);
        session.markExtracted("텍스트", null);

        assertThatThrownBy(() -> session.markQuestionsReady(List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("questions");
    }

    // ─────────────────────────────────────────────
    // 포트폴리오 URL 포함
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("portfolioUrl이 있으면 세션에 저장")
    void portfolioUrl_저장() {
        ResumeSession session = new ResumeSession(member, "BE", "테스트", "https://github.com/user");
        assertThat(session.getPortfolioUrl()).isEqualTo("https://github.com/user");
    }

    // ─────────────────────────────────────────────
    // getQuestions 불변성
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("getQuestions() 반환값은 수정 불가(unmodifiableList)")
    void getQuestions_불변성() {
        ResumeSession session = new ResumeSession(member, "BE", "테스트", null);
        StoredFileRef ref = new StoredFileRef("key", "file.pdf", "application/pdf", 100L);
        session.attachFiles(ref, null);
        session.markExtracted("텍스트", null);
        session.markQuestionsReady(List.of(dummyQuestion()));

        assertThatThrownBy(() -> session.getQuestions().add(dummyQuestion()))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    // ─────────────────────────────────────────────
    // 헬퍼
    // ─────────────────────────────────────────────

    private ResumeQuestion dummyQuestion() {
        InterviewQuestion vo = new InterviewQuestion(
                "자기소개를 해주세요.", "지원자 배경 파악", "경험, 기술", "간결하게"
        );
        return new ResumeQuestion(0, "자기소개", 90, vo);
    }
}
