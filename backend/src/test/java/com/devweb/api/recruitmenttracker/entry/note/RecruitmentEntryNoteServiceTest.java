package com.devweb.api.recruitmenttracker.entry.note;

import com.devweb.api.recruitmenttracker.entry.RecruitmentEntryService;
import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import com.devweb.domain.recruitmenttracker.note.model.RecruitmentEntryNote;
import com.devweb.domain.recruitmenttracker.note.port.RecruitmentEntryNoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class RecruitmentEntryNoteServiceTest {

    @Mock RecruitmentEntryService entryService;
    @Mock RecruitmentEntryNoteRepository noteRepository;

    @InjectMocks RecruitmentEntryNoteService sut;

    private Member member;
    private RecruitmentEntry entry;

    @BeforeEach
    void setUp() {
        member = new Member("test@example.com");
        entry = entryWithId(1L);
    }

    // ─────────────────────────────────────────────
    // list
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("메모 목록 조회 성공")
    void list_성공() {
        // given
        given(entryService.get(1L)).willReturn(entry);
        given(noteRepository.findAllByEntryId(1L)).willReturn(List.of(
                new RecruitmentEntryNote(entry, "1차 면접 통과"),
                new RecruitmentEntryNote(entry, "코딩 테스트 준비 중")
        ));

        // when
        List<RecruitmentEntryNote> result = sut.list(1L);

        // then
        assertThat(result).hasSize(2);
    }

    @Test
    @DisplayName("존재하지 않는 entry의 메모 조회 시 ResourceNotFoundException 위임")
    void list_존재하지않는_entry_예외() {
        // given
        given(entryService.get(99L)).willThrow(new ResourceNotFoundException("Entry not found"));

        // when & then
        assertThatThrownBy(() -> sut.list(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─────────────────────────────────────────────
    // create
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("메모 생성 성공")
    void create_성공() {
        // given
        given(entryService.get(1L)).willReturn(entry);
        given(noteRepository.save(any(RecruitmentEntryNote.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        RecruitmentEntryNote result = sut.create(1L, "1차 면접 준비 메모");

        // then
        assertThat(result.getContent()).isEqualTo("1차 면접 준비 메모");
    }

    @Test
    @DisplayName("content가 앞뒤 공백 포함되면 trim 처리됨")
    void create_content_trim_처리() {
        // given
        given(entryService.get(1L)).willReturn(entry);
        given(noteRepository.save(any(RecruitmentEntryNote.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        RecruitmentEntryNote result = sut.create(1L, "  메모 내용  ");

        // then
        assertThat(result.getContent()).isEqualTo("메모 내용"); // 도메인 엔티티 생성자에서 trim
    }

    @Test
    @DisplayName("content가 null이면 IllegalArgumentException")
    void create_content_null_예외() {
        // given
        given(entryService.get(1L)).willReturn(entry);

        // when & then
        assertThatThrownBy(() -> sut.create(1L, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("content");
    }

    @Test
    @DisplayName("content가 blank이면 IllegalArgumentException")
    void create_content_blank_예외() {
        // given
        given(entryService.get(1L)).willReturn(entry);

        // when & then
        assertThatThrownBy(() -> sut.create(1L, "   "))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("content");
    }

    // ─────────────────────────────────────────────
    // update
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("메모 업데이트 성공")
    void update_성공() {
        // given
        RecruitmentEntryNote note = noteWithId(10L, entry, "기존 내용");
        given(noteRepository.findById(10L)).willReturn(Optional.of(note));

        // when
        RecruitmentEntryNote result = sut.update(1L, 10L, "수정된 내용");

        // then
        assertThat(result.getContent()).isEqualTo("수정된 내용");
    }

    @Test
    @DisplayName("다른 entry에 속한 note 수정 시 ResourceNotFoundException (소유권 검증)")
    void update_다른_entry의_note_소유권_검증_예외() {
        // given: entry id=1의 노트이지만 entry id=2로 수정 요청
        RecruitmentEntryNote note = noteWithId(10L, entry, "내용"); // entry.id = 1
        given(noteRepository.findById(10L)).willReturn(Optional.of(note));

        // when & then: entryId=2로 update 요청 → 소유권 검증 실패
        assertThatThrownBy(() -> sut.update(2L, 10L, "수정 시도"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("존재하지 않는 note 수정 시 ResourceNotFoundException")
    void update_없는_note_예외() {
        given(noteRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.update(1L, 99L, "수정 시도"))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─────────────────────────────────────────────
    // delete
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("메모 삭제 성공")
    void delete_성공() {
        // given
        RecruitmentEntryNote note = noteWithId(10L, entry, "삭제할 메모");
        given(noteRepository.findById(10L)).willReturn(Optional.of(note));

        // when
        sut.delete(1L, 10L);

        // then
        then(noteRepository).should().delete(note);
    }

    @Test
    @DisplayName("다른 entry에 속한 note 삭제 시 ResourceNotFoundException (소유권 검증)")
    void delete_소유권_검증_예외() {
        // given: note는 entry id=1 소속, 삭제 요청은 entry id=2
        RecruitmentEntryNote note = noteWithId(10L, entry, "내용"); // entry.id = 1
        given(noteRepository.findById(10L)).willReturn(Optional.of(note));

        // when & then
        assertThatThrownBy(() -> sut.delete(2L, 10L))
                .isInstanceOf(ResourceNotFoundException.class);
        then(noteRepository).should(never()).delete(any()); // 삭제 미호출 확인
    }

    // ─────────────────────────────────────────────
    // 헬퍼 메서드
    // ─────────────────────────────────────────────

    /**
     * ID가 설정된 RecruitmentEntry를 Reflection으로 생성
     * (엔티티 id는 JPA가 관리하므로 테스트에서 직접 설정 필요)
     */
    private RecruitmentEntry entryWithId(Long id) {
        RecruitmentEntry e = new RecruitmentEntry(member, "카카오", "백엔드", null, null, null);
        try {
            var field = RecruitmentEntry.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(e, id);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
        return e;
    }

    private RecruitmentEntryNote noteWithId(Long id, RecruitmentEntry entry, String content) {
        RecruitmentEntryNote note = new RecruitmentEntryNote(entry, content);
        try {
            var field = RecruitmentEntryNote.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(note, id);
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
        return note;
    }
}
