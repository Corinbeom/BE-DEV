package com.devweb.api.studyquiz.session;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.*;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import com.devweb.domain.studyquiz.session.port.CsQuizSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.devweb.api.studyquiz.session.dto.CsQuizStatsResponse;
import com.devweb.domain.member.event.MemberDeletedEvent;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class CsQuizSessionServiceTest {

    @Mock CsQuizSessionRepository sessionRepository;
    @Mock CsQuestionBankRepository bankRepository;
    @Mock MemberRepository memberRepository;
    @Mock CsQuizAiPort csQuizAiPort;

    @InjectMocks CsQuizSessionService sut;

    private Member member;

    @BeforeEach
    void setUp() {
        member = new Member("test@example.com");
    }

    // ─────────────────────────────────────────────
    // 정상 케이스
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("문제은행에서 충분한 문제가 있을 때 AI 호출 없이 세션 생성")
    void create_성공_문제은행에서_충분한_문제() {
        // given
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));

        List<CsQuestionBankItem> mcItems = List.of(
                bankMcItem(CsQuizTopic.OS, CsQuizDifficulty.MID),
                bankMcItem(CsQuizTopic.OS, CsQuizDifficulty.MID),
                bankMcItem(CsQuizTopic.OS, CsQuizDifficulty.MID)
        );
        List<CsQuestionBankItem> saItems = List.of(
                bankSaItem(CsQuizTopic.OS, CsQuizDifficulty.MID),
                bankSaItem(CsQuizTopic.OS, CsQuizDifficulty.MID)
        );
        given(bankRepository.findAllBy(CsQuizTopic.OS, CsQuizDifficulty.MID, CsQuizQuestionType.MULTIPLE_CHOICE))
                .willReturn(mcItems);
        given(bankRepository.findAllBy(CsQuizTopic.OS, CsQuizDifficulty.MID, CsQuizQuestionType.SHORT_ANSWER))
                .willReturn(saItems);

        CsQuizSession saved = new CsQuizSession(member, "테스트 세션", CsQuizDifficulty.MID, Set.of(CsQuizTopic.OS));
        given(sessionRepository.save(any())).willReturn(saved);

        // when
        CsQuizSession result = sut.create(1L, "MID", List.of("OS"), 5, "테스트 세션");

        // then
        assertThat(result).isNotNull();
        then(csQuizAiPort).shouldHaveNoInteractions(); // AI 미호출 검증
    }

    @Test
    @DisplayName("문제은행 문제 부족 시 AI fallback으로 나머지 문제 생성")
    void create_성공_문제은행_부족시_AI_fallback() {
        // given
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));

        // MC 1개만 있음 (3개 필요)
        given(bankRepository.findAllBy(CsQuizTopic.DB, CsQuizDifficulty.LOW, CsQuizQuestionType.MULTIPLE_CHOICE))
                .willReturn(List.of(bankMcItem(CsQuizTopic.DB, CsQuizDifficulty.LOW)));
        // SA 충분
        given(bankRepository.findAllBy(CsQuizTopic.DB, CsQuizDifficulty.LOW, CsQuizQuestionType.SHORT_ANSWER))
                .willReturn(List.of(
                        bankSaItem(CsQuizTopic.DB, CsQuizDifficulty.LOW),
                        bankSaItem(CsQuizTopic.DB, CsQuizDifficulty.LOW)
                ));

        // AI가 부족한 MC 2개 생성
        given(csQuizAiPort.generateQuestions(anyString(), anySet(), any(), eq(2), eq(0)))
                .willReturn(List.of(
                        aiMcQuestion(CsQuizTopic.DB, CsQuizDifficulty.LOW),
                        aiMcQuestion(CsQuizTopic.DB, CsQuizDifficulty.LOW)
                ));

        CsQuizSession saved = new CsQuizSession(member, "DB Quiz", CsQuizDifficulty.LOW, Set.of(CsQuizTopic.DB));
        given(sessionRepository.save(any())).willReturn(saved);

        // when
        CsQuizSession result = sut.create(1L, "LOW", List.of("DB"), 5, "DB Quiz");

        // then
        assertThat(result).isNotNull();
        then(csQuizAiPort).should().generateQuestions(anyString(), anySet(), any(), eq(2), eq(0));
    }

    @Test
    @DisplayName("5개 요청 시 MC 3개, SA 2개 비율 검증")
    void create_성공_MC60_SA40_비율_검증() {
        // given
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));

        given(bankRepository.findAllBy(any(CsQuizTopic.class), any(CsQuizDifficulty.class), eq(CsQuizQuestionType.MULTIPLE_CHOICE)))
                .willReturn(List.of(
                        bankMcItem(CsQuizTopic.JAVA, CsQuizDifficulty.HIGH),
                        bankMcItem(CsQuizTopic.JAVA, CsQuizDifficulty.HIGH),
                        bankMcItem(CsQuizTopic.JAVA, CsQuizDifficulty.HIGH)
                ));
        given(bankRepository.findAllBy(any(CsQuizTopic.class), any(CsQuizDifficulty.class), eq(CsQuizQuestionType.SHORT_ANSWER)))
                .willReturn(List.of(
                        bankSaItem(CsQuizTopic.JAVA, CsQuizDifficulty.HIGH),
                        bankSaItem(CsQuizTopic.JAVA, CsQuizDifficulty.HIGH)
                ));

        given(sessionRepository.save(any(CsQuizSession.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        CsQuizSession result = sut.create(1L, "HIGH", List.of("JAVA"), 5, null);

        // then
        // 5 * 0.6 = 3개 MC, 2개 SA
        assertThat(result.getQuestions()).hasSize(5);
        long mcCount = result.getQuestions().stream().filter(CsQuizQuestion::isMultipleChoice).count();
        long saCount = result.getQuestions().stream().filter(CsQuizQuestion::isShortAnswer).count();
        assertThat(mcCount).isEqualTo(3);
        assertThat(saCount).isEqualTo(2);
    }

    @Test
    @DisplayName("title이 null이면 기본값 'CS Quiz (DIFFICULTY)' 사용")
    void create_성공_title_null이면_기본값() {
        // given
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));
        given(bankRepository.findAllBy(any(), any(), any())).willReturn(List.of());
        given(csQuizAiPort.generateQuestions(anyString(), anySet(), any(), anyInt(), anyInt()))
                .willReturn(List.of(
                        aiMcQuestion(CsQuizTopic.NETWORK, CsQuizDifficulty.LOW),
                        aiMcQuestion(CsQuizTopic.NETWORK, CsQuizDifficulty.LOW),
                        aiMcQuestion(CsQuizTopic.NETWORK, CsQuizDifficulty.LOW)
                ))
                .willReturn(List.of(
                        aiSaQuestion(CsQuizTopic.NETWORK, CsQuizDifficulty.LOW),
                        aiSaQuestion(CsQuizTopic.NETWORK, CsQuizDifficulty.LOW)
                ));
        given(sessionRepository.save(any(CsQuizSession.class))).willAnswer(inv -> inv.getArgument(0));

        // when
        CsQuizSession result = sut.create(1L, "LOW", List.of("NETWORK"), 5, null);

        // then
        assertThat(result.getTitle()).isEqualTo("CS Quiz (LOW)");
    }

    // ─────────────────────────────────────────────
    // 유효성 검증 실패
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("questionCount가 5 미만이면 IllegalArgumentException")
    void create_실패_문제수_5미만() {
        assertThatThrownBy(() -> sut.create(1L, "MID", List.of("OS"), 4, "테스트"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5~10");
    }

    @Test
    @DisplayName("questionCount가 10 초과이면 IllegalArgumentException")
    void create_실패_문제수_10초과() {
        assertThatThrownBy(() -> sut.create(1L, "MID", List.of("OS"), 11, "테스트"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("5~10");
    }

    @Test
    @DisplayName("topics가 null이면 IllegalArgumentException")
    void create_실패_topics_null() {
        assertThatThrownBy(() -> sut.create(1L, "MID", null, 5, "테스트"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("topics");
    }

    @Test
    @DisplayName("topics가 빈 리스트이면 IllegalArgumentException")
    void create_실패_topics_빈리스트() {
        assertThatThrownBy(() -> sut.create(1L, "MID", List.of(), 5, "테스트"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("topics");
    }

    @Test
    @DisplayName("존재하지 않는 멤버 ID로 세션 생성 시 ResourceNotFoundException")
    void create_실패_존재하지않는_멤버() {
        // given
        given(memberRepository.findById(99L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> sut.create(99L, "MID", List.of("OS"), 5, "테스트"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    @DisplayName("잘못된 difficulty 값이면 IllegalArgumentException")
    void create_실패_잘못된_difficulty() {
        assertThatThrownBy(() -> sut.create(1L, "INVALID_DIFFICULTY", List.of("OS"), 5, "테스트"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("잘못된 topic 값이면 IllegalArgumentException")
    void create_실패_잘못된_topic() {
        assertThatThrownBy(() -> sut.create(1L, "MID", List.of("INVALID_TOPIC"), 5, "테스트"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    // ─────────────────────────────────────────────
    // get 테스트
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("세션 조회 성공")
    void get_성공() {
        // given
        CsQuizSession session = new CsQuizSession(member, "테스트", CsQuizDifficulty.MID, Set.of(CsQuizTopic.OS));
        given(sessionRepository.findById(1L)).willReturn(Optional.of(session));

        // when
        CsQuizSession result = sut.get(1L);

        // then
        assertThat(result).isEqualTo(session);
    }

    @Test
    @DisplayName("존재하지 않는 세션 조회 시 ResourceNotFoundException")
    void get_실패_존재하지않는_세션() {
        given(sessionRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.get(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    // ─────────────────────────────────────────────
    // listByMember 테스트
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("멤버 세션 목록 조회 성공")
    void listByMember_성공() {
        // given
        CsQuizSession s1 = new CsQuizSession(member, "세션1", CsQuizDifficulty.LOW, Set.of(CsQuizTopic.OS));
        CsQuizSession s2 = new CsQuizSession(member, "세션2", CsQuizDifficulty.MID, Set.of(CsQuizTopic.DB));
        given(sessionRepository.findAllByMemberId(1L)).willReturn(List.of(s1, s2));

        // when
        List<CsQuizSession> result = sut.listByMember(1L);

        // then
        assertThat(result).hasSize(2);
        then(sessionRepository).should().findAllByMemberId(1L);
    }

    @Test
    @DisplayName("멤버 세션이 없으면 빈 리스트 반환")
    void listByMember_세션없음_빈리스트() {
        // given
        given(sessionRepository.findAllByMemberId(42L)).willReturn(List.of());

        // when
        List<CsQuizSession> result = sut.listByMember(42L);

        // then
        assertThat(result).isEmpty();
    }

    // ─────────────────────────────────────────────
    // delete 테스트
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("세션 삭제 성공")
    void delete_성공() {
        // given
        CsQuizSession session = new CsQuizSession(member, "삭제할 세션", CsQuizDifficulty.HIGH, Set.of(CsQuizTopic.JAVA));
        given(sessionRepository.findById(1L)).willReturn(Optional.of(session));

        // when
        sut.delete(1L);

        // then
        then(sessionRepository).should().deleteById(1L);
    }

    @Test
    @DisplayName("존재하지 않는 세션 삭제 시 ResourceNotFoundException, deleteById 미호출")
    void delete_실패_존재하지않는_세션() {
        // given
        given(sessionRepository.findById(99L)).willReturn(Optional.empty());

        // when & then
        assertThatThrownBy(() -> sut.delete(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
        then(sessionRepository).should(never()).deleteById(anyLong());
    }

    // ─────────────────────────────────────────────
    // getStats 테스트
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("통계 조회 성공 — 토픽별 정답률 계산")
    void getStats_성공_데이터있음() {
        // given
        Object[] osRow  = new Object[]{CsQuizTopic.OS,  10L, 7L};
        Object[] dbRow  = new Object[]{CsQuizTopic.DB,   5L, 2L};
        given(sessionRepository.findStatsGroupedByTopic(1L)).willReturn(List.of(osRow, dbRow));

        // when
        CsQuizStatsResponse result = sut.getStats(1L);

        // then
        assertThat(result.totalAttempts()).isEqualTo(15);
        assertThat(result.correctCount()).isEqualTo(9);
        assertThat(result.overallAccuracy()).isCloseTo(0.6, within(0.001));
        assertThat(result.topicAccuracies()).hasSize(2);
        CsQuizStatsResponse.TopicAccuracy osStat = result.topicAccuracies().get(0);
        assertThat(osStat.topic()).isEqualTo("OS");
        assertThat(osStat.accuracy()).isCloseTo(0.7, within(0.001));
    }

    @Test
    @DisplayName("통계 조회 성공 — 풀이 데이터 없을 때 정답률 0")
    void getStats_성공_데이터없음() {
        // given
        given(sessionRepository.findStatsGroupedByTopic(1L)).willReturn(List.of());

        // when
        CsQuizStatsResponse result = sut.getStats(1L);

        // then
        assertThat(result.totalAttempts()).isZero();
        assertThat(result.correctCount()).isZero();
        assertThat(result.overallAccuracy()).isZero();
        assertThat(result.topicAccuracies()).isEmpty();
    }

    // ─────────────────────────────────────────────
    // onMemberDeleted 테스트
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("멤버 삭제 이벤트 수신 시 해당 멤버의 모든 세션 삭제")
    void onMemberDeleted_세션있음_모두삭제() {
        // given
        CsQuizSession s1 = new CsQuizSession(member, "세션1", CsQuizDifficulty.LOW, Set.of(CsQuizTopic.OS));
        CsQuizSession s2 = new CsQuizSession(member, "세션2", CsQuizDifficulty.MID, Set.of(CsQuizTopic.DB));
        // ID 주입을 위해 findById 셋업 (delete 내부에서 get() 호출)
        given(sessionRepository.findAllByMemberId(1L)).willReturn(List.of(s1, s2));
        given(sessionRepository.findById(s1.getId())).willReturn(Optional.of(s1));
        given(sessionRepository.findById(s2.getId())).willReturn(Optional.of(s2));

        // when
        sut.onMemberDeleted(new MemberDeletedEvent(1L));

        // then
        then(sessionRepository).should(times(2)).deleteById(any());
    }

    @Test
    @DisplayName("멤버 삭제 이벤트 수신 시 세션이 없으면 deleteById 미호출")
    void onMemberDeleted_세션없음_deleteById_미호출() {
        // given
        given(sessionRepository.findAllByMemberId(99L)).willReturn(List.of());

        // when
        sut.onMemberDeleted(new MemberDeletedEvent(99L));

        // then
        then(sessionRepository).should(never()).deleteById(anyLong());
    }

    // ─────────────────────────────────────────────
    // 헬퍼 메서드
    // ─────────────────────────────────────────────

    private CsQuestionBankItem bankMcItem(CsQuizTopic topic, CsQuizDifficulty difficulty) {
        return CsQuestionBankItem.multipleChoice(
                topic, difficulty,
                "테스트 객관식 문제",
                List.of("선택지A", "선택지B", "선택지C", "선택지D"),
                0,
                "참조 답변"
        );
    }

    private CsQuestionBankItem bankSaItem(CsQuizTopic topic, CsQuizDifficulty difficulty) {
        return CsQuestionBankItem.shortAnswer(
                topic, difficulty,
                "테스트 단답형 문제",
                List.of("키워드1", "키워드2"),
                "참조 답변"
        );
    }

    private CsQuizAiPort.GeneratedQuizQuestion aiMcQuestion(CsQuizTopic topic, CsQuizDifficulty difficulty) {
        return new CsQuizAiPort.GeneratedQuizQuestion(
                topic, difficulty, CsQuizQuestionType.MULTIPLE_CHOICE,
                "AI 생성 객관식 문제",
                List.of("A", "B", "C", "D"),
                0,
                "AI 참조 답변",
                List.of()
        );
    }

    private CsQuizAiPort.GeneratedQuizQuestion aiSaQuestion(CsQuizTopic topic, CsQuizDifficulty difficulty) {
        return new CsQuizAiPort.GeneratedQuizQuestion(
                topic, difficulty, CsQuizQuestionType.SHORT_ANSWER,
                "AI 생성 단답형 문제",
                List.of(),
                null,
                "AI 참조 답변",
                List.of("키워드1")
        );
    }
}
