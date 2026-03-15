package com.devweb.domain.resume.model;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.session.model.StoredFileRef;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class ResumeTest {

    private final Member member = new Member("test@example.com");

    // ─────────────────────────────────────────────
    // 생성자 정상
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("생성자 정상 - 초기 상태 PENDING, fileType 설정")
    void 생성자_정상() {
        Resume resume = new Resume(member, "내 이력서", ResumeFileType.RESUME);

        assertThat(resume.getMember()).isEqualTo(member);
        assertThat(resume.getTitle()).isEqualTo("내 이력서");
        assertThat(resume.getFileType()).isEqualTo(ResumeFileType.RESUME);
        assertThat(resume.getExtractStatus()).isEqualTo(ResumeExtractStatus.PENDING);
        assertThat(resume.getStoredFile()).isNull();
        assertThat(resume.getExtractedText()).isNull();
    }

    // ─────────────────────────────────────────────
    // 생성자 실패
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("생성자 실패 - member null")
    void 생성자_실패_member_null() {
        assertThatThrownBy(() -> new Resume(null, "제목", ResumeFileType.RESUME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("member");
    }

    @Test
    @DisplayName("생성자 실패 - title blank")
    void 생성자_실패_title_blank() {
        assertThatThrownBy(() -> new Resume(member, "  ", ResumeFileType.RESUME))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("title");
    }

    @Test
    @DisplayName("생성자 실패 - fileType null")
    void 생성자_실패_fileType_null() {
        assertThatThrownBy(() -> new Resume(member, "제목", null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("fileType");
    }

    // ─────────────────────────────────────────────
    // attachFile
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("attachFile 정상")
    void attachFile_정상() {
        Resume resume = new Resume(member, "이력서", ResumeFileType.RESUME);
        StoredFileRef ref = new StoredFileRef("key", "resume.pdf", "application/pdf", 100L);

        resume.attachFile(ref);

        assertThat(resume.getStoredFile()).isEqualTo(ref);
    }

    @Test
    @DisplayName("attachFile 실패 - null")
    void attachFile_실패_null() {
        Resume resume = new Resume(member, "이력서", ResumeFileType.RESUME);

        assertThatThrownBy(() -> resume.attachFile(null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("storedFile");
    }

    // ─────────────────────────────────────────────
    // markExtracted
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("markExtracted 정상")
    void markExtracted_정상() {
        Resume resume = new Resume(member, "이력서", ResumeFileType.RESUME);

        resume.markExtracted("추출된 텍스트 내용");

        assertThat(resume.getExtractStatus()).isEqualTo(ResumeExtractStatus.EXTRACTED);
        assertThat(resume.getExtractedText()).isEqualTo("추출된 텍스트 내용");
    }

    @Test
    @DisplayName("markExtracted 실패 - blank")
    void markExtracted_실패_blank() {
        Resume resume = new Resume(member, "이력서", ResumeFileType.RESUME);

        assertThatThrownBy(() -> resume.markExtracted("  "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("extractedText");
    }

    // ─────────────────────────────────────────────
    // markExtractFailed
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("markExtractFailed - 상태 FAILED로 전이")
    void markExtractFailed_상태전이() {
        Resume resume = new Resume(member, "이력서", ResumeFileType.RESUME);
        assertThat(resume.getExtractStatus()).isEqualTo(ResumeExtractStatus.PENDING);

        resume.markExtractFailed();

        assertThat(resume.getExtractStatus()).isEqualTo(ResumeExtractStatus.FAILED);
    }
}
