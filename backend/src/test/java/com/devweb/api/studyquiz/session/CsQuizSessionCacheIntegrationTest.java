package com.devweb.api.studyquiz.session;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.*;
import com.devweb.domain.resume.session.port.InterviewAiPort;
import com.devweb.domain.studyquiz.session.port.CsQuizAiPort;
import com.devweb.domain.studyquiz.session.port.CsQuizSessionRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.cache.type=simple",
        "spring.data.redis.host=",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration",
        "spring.jpa.defer-datasource-initialization=false",
        "spring.sql.init.mode=never"
})
class CsQuizSessionCacheIntegrationTest {

    @Autowired CsQuizSessionService service;
    @Autowired CacheManager cacheManager;
    @Autowired EntityManager em;

    @Autowired CsQuizSessionRepository sessionRepository;
    @Autowired MemberRepository memberRepository;

    @MockBean CsQuizAiPort csQuizAiPort;
    @MockBean InterviewAiPort interviewAiPort;
    @MockBean CsQuestionBankRepository bankRepository;

    private Member member;

    @BeforeEach
    void setUp() {
        // 캐시 초기화
        cacheManager.getCacheNames().forEach(name ->
                cacheManager.getCache(name).clear()
        );

        member = new Member("cache-test@example.com");
        em.persist(member);
        em.flush();
    }

    @Test
    @DisplayName("listByMemberCached — 첫 호출: 캐시 미스, 두 번째: 캐시 히트")
    @Transactional
    void listByMemberCached_캐시_히트_확인() {
        // given: 세션 데이터 준비
        insertSession(member);

        // when: 첫 호출 (캐시 미스)
        var first = service.listByMemberCached(member.getId());

        // then: 캐시에 저장됨
        assertThat(first).isNotEmpty();
        assertThat(cacheManager.getCache("csQuizSessions").get(member.getId())).isNotNull();

        // when: 두 번째 호출 (캐시 히트 — DB 재조회 없이 동일 결과)
        var second = service.listByMemberCached(member.getId());
        assertThat(second).hasSameSizeAs(first);
    }

    @Test
    @DisplayName("delete 시 stats + csQuizSessions 캐시 무효화")
    @Transactional
    void delete_시_캐시_무효화() {
        // given: 세션 생성 후 캐시 워밍
        CsQuizSession session = insertSession(member);
        service.listByMemberCached(member.getId());
        service.getStats(member.getId());
        assertThat(cacheManager.getCache("csQuizSessions").get(member.getId())).isNotNull();
        assertThat(cacheManager.getCache("stats").get(member.getId())).isNotNull();

        // when
        service.delete(session.getId());

        // then: 두 캐시 모두 무효화
        assertThat(cacheManager.getCache("csQuizSessions").get(member.getId())).isNull();
        assertThat(cacheManager.getCache("stats").get(member.getId())).isNull();
    }

    @Test
    @DisplayName("getStats — 캐시 히트/미스 검증")
    @Transactional
    void getStats_캐시_동작_확인() {
        // given
        assertThat(cacheManager.getCache("stats").get(member.getId())).isNull();

        // when: 첫 호출
        var first = service.getStats(member.getId());
        assertThat(cacheManager.getCache("stats").get(member.getId())).isNotNull();

        // when: 두 번째 호출 (캐시 히트)
        var second = service.getStats(member.getId());
        assertThat(second.totalAttempts()).isEqualTo(first.totalAttempts());
    }

    @Test
    @DisplayName("create 시 stats + csQuizSessions 동시 무효화")
    @Transactional
    void create_시_stats_csQuizSessions_동시_무효화() {
        // given: 캐시 워밍
        service.listByMemberCached(member.getId());
        service.getStats(member.getId());
        assertThat(cacheManager.getCache("csQuizSessions").get(member.getId())).isNotNull();
        assertThat(cacheManager.getCache("stats").get(member.getId())).isNotNull();

        // given: bank에서 충분한 문제 제공
        given(bankRepository.findAllBy(any(), any(), eq(CsQuizQuestionType.MULTIPLE_CHOICE)))
                .willReturn(List.of(
                        bankMcItem(), bankMcItem(), bankMcItem()
                ));
        given(bankRepository.findAllBy(any(), any(), eq(CsQuizQuestionType.SHORT_ANSWER)))
                .willReturn(List.of(
                        bankSaItem(), bankSaItem()
                ));

        // when
        service.create(member.getId(), "MID", List.of("OS"), 5, "캐시 테스트");

        // then: 두 캐시 모두 무효화
        assertThat(cacheManager.getCache("csQuizSessions").get(member.getId())).isNull();
        assertThat(cacheManager.getCache("stats").get(member.getId())).isNull();
    }

    // ─── helpers ───

    private CsQuizSession insertSession(Member m) {
        CsQuizSession session = new CsQuizSession(m, "테스트", CsQuizDifficulty.MID, Set.of(CsQuizTopic.OS));
        CsQuizQuestion q = CsQuizQuestion.multipleChoice(
                0, CsQuizTopic.OS, CsQuizDifficulty.MID,
                "질문", List.of("A", "B", "C", "D"), 0, "참조"
        );
        session.markQuestionsReady(List.of(q));
        return sessionRepository.save(session);
    }

    private CsQuestionBankItem bankMcItem() {
        return CsQuestionBankItem.multipleChoice(
                CsQuizTopic.OS, CsQuizDifficulty.MID,
                "객관식 문제", List.of("A", "B", "C", "D"), 0, "참조"
        );
    }

    private CsQuestionBankItem bankSaItem() {
        return CsQuestionBankItem.shortAnswer(
                CsQuizTopic.OS, CsQuizDifficulty.MID,
                "단답형 문제", List.of("키워드"), "참조"
        );
    }
}
