package com.devweb.api.resume.session;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.model.InterviewQuestion;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.model.StoredFileRef;
import com.devweb.domain.resume.session.port.FileStoragePort;
import com.devweb.domain.resume.session.port.ResumeSessionRepository;
import com.devweb.domain.resume.session.port.TextExtractorPort;
import com.devweb.domain.resume.session.port.UrlTextFetcherPort;
import com.devweb.domain.resume.session.service.QuestionGenerator;
import com.devweb.infra.ai.gemini.GeminiInterviewAiAdapter;
import com.devweb.infra.ai.groq.GroqInterviewAiAdapter;
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

import static org.assertj.core.api.Assertions.*;

@SpringBootTest
@TestPropertySource(properties = {
        "spring.cache.type=simple",
        "spring.data.redis.host=",
        "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration,org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration",
        "spring.jpa.defer-datasource-initialization=false",
        "spring.sql.init.mode=never"
})
class ResumeSessionCacheIntegrationTest {

    @Autowired ResumeSessionService service;
    @Autowired CacheManager cacheManager;
    @Autowired EntityManager em;
    @Autowired ResumeSessionRepository sessionRepository;

    @MockBean GeminiInterviewAiAdapter geminiAdapter;
    @MockBean GroqInterviewAiAdapter groqAdapter;
    @MockBean FileStoragePort fileStoragePort;
    @MockBean TextExtractorPort textExtractorPort;
    @MockBean UrlTextFetcherPort urlTextFetcherPort;
    @MockBean QuestionGenerator questionGenerator;

    private Member member;

    @BeforeEach
    void setUp() {
        cacheManager.getCacheNames().forEach(name ->
                cacheManager.getCache(name).clear()
        );

        member = new Member("resume-cache@example.com");
        em.persist(member);
        em.flush();
    }

    @Test
    @DisplayName("listByMemberCached — 첫 호출: 캐시 미스, 두 번째: 캐시 히트")
    @Transactional
    void listByMemberCached_캐시_히트_확인() {
        // given
        insertSession(member);
        assertThat(cacheManager.getCache("resumeSessions").get(member.getId())).isNull();

        // when: 첫 호출
        var first = service.listByMemberCached(member.getId());
        assertThat(cacheManager.getCache("resumeSessions").get(member.getId())).isNotNull();

        // when: 두 번째 호출
        var second = service.listByMemberCached(member.getId());
        assertThat(second).hasSameSizeAs(first);
    }

    @Test
    @DisplayName("delete 시 resumeSessions 캐시 무효화")
    @Transactional
    void delete_시_캐시_무효화() {
        // given
        ResumeSession session = insertSession(member);
        service.listByMemberCached(member.getId());
        assertThat(cacheManager.getCache("resumeSessions").get(member.getId())).isNotNull();

        // when
        service.delete(session.getId());

        // then
        assertThat(cacheManager.getCache("resumeSessions").get(member.getId())).isNull();
    }

    // ─── helpers ───

    private ResumeSession insertSession(Member m) {
        ResumeSession session = new ResumeSession(m, "BE", "테스트 세션", null);
        session.attachFiles(
                new StoredFileRef("key", "resume.pdf", "application/pdf", 1024L),
                null
        );
        session.markExtracted("이력서 텍스트", null);
        session.markQuestionsReady(List.of(
                new ResumeQuestion(0, "기술", 80,
                        new InterviewQuestion("질문1", "의도", "키워드", "모범답안"))
        ));
        return sessionRepository.save(session);
    }
}
