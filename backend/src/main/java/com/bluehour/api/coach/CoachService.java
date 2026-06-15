package com.bluehour.api.coach;

import com.bluehour.api.coach.dto.CoachAnalysisResponse;
import com.bluehour.api.coach.dto.CoachSummaryResponse;
import com.bluehour.common.ResourceNotFoundException;
import com.bluehour.domain.coach.port.CoachAiPort;
import com.bluehour.domain.member.model.Member;
import com.bluehour.domain.member.port.MemberRepository;
import com.bluehour.domain.recruitmenttracker.entry.model.RecruitmentEntry;
import com.bluehour.domain.recruitmenttracker.entry.model.RecruitmentStep;
import com.bluehour.domain.recruitmenttracker.entry.port.RecruitmentEntryRepository;
import com.bluehour.domain.resume.model.Resume;
import com.bluehour.domain.resume.model.ResumeExtractStatus;
import com.bluehour.domain.resume.port.ResumeRepository;
import com.bluehour.domain.speechinterview.model.SpeechInterviewSession;
import com.bluehour.domain.speechinterview.model.SpeechInterviewStatus;
import com.bluehour.domain.speechinterview.port.SpeechInterviewSessionRepository;
import com.bluehour.domain.studyquiz.session.model.CsQuizTopic;
import com.bluehour.domain.studyquiz.session.port.CsQuizSessionRepository;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class CoachService {

    private static final String CACHE_ANALYSIS = "coachAnalysis";

    private final MemberRepository memberRepository;
    private final RecruitmentEntryRepository recruitmentEntryRepository;
    private final ResumeRepository resumeRepository;
    private final SpeechInterviewSessionRepository speechInterviewSessionRepository;
    private final CsQuizSessionRepository csQuizSessionRepository;
    private final CoachAiPort coachAiPort;
    private final CacheManager cacheManager;

    public CoachService(
            MemberRepository memberRepository,
            RecruitmentEntryRepository recruitmentEntryRepository,
            ResumeRepository resumeRepository,
            SpeechInterviewSessionRepository speechInterviewSessionRepository,
            CsQuizSessionRepository csQuizSessionRepository,
            CoachAiPort coachAiPort,
            CacheManager cacheManager
    ) {
        this.memberRepository = memberRepository;
        this.recruitmentEntryRepository = recruitmentEntryRepository;
        this.resumeRepository = resumeRepository;
        this.speechInterviewSessionRepository = speechInterviewSessionRepository;
        this.csQuizSessionRepository = csQuizSessionRepository;
        this.coachAiPort = coachAiPort;
        this.cacheManager = cacheManager;
    }

    @Cacheable(value = "coachSummary", key = "#memberId")
    public CoachSummaryResponse getSummary(Long memberId) {
        return buildSnapshot(memberId).summary();
    }

    public CoachAnalysisResponse getAnalysis(Long memberId) {
        CoachSnapshot snapshot = buildSnapshot(memberId);
        CoachAiPort.CoachContext context = snapshot.context();
        if (context.targetRoles().isEmpty()) {
            return CoachAnalysisResponse.forMissingTargetRoles();
        }

        String key = memberId + ":" + contextHash(context);
        Cache cache = cacheManager.getCache(CACHE_ANALYSIS);
        if (cache != null) {
            CoachAnalysisResponse cached = cache.get(key, CoachAnalysisResponse.class);
            if (cached != null) return cached;
        }

        CoachAnalysisResponse response = CoachAnalysisResponse.from(coachAiPort.analyzeReadiness(context));
        if (cache != null) {
            cache.put(key, response);
        }
        return response;
    }

    public CoachAnalysisResponse refresh(Long memberId) {
        Cache summary = cacheManager.getCache("coachSummary");
        if (summary != null) summary.evict(memberId);

        Cache analysis = cacheManager.getCache(CACHE_ANALYSIS);
        if (analysis != null) analysis.clear();

        return getAnalysis(memberId);
    }

    private CoachSnapshot buildSnapshot(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));
        List<RecruitmentEntry> entries = recruitmentEntryRepository.findAllByMemberId(memberId);
        List<Resume> resumes = resumeRepository.findAllByMemberId(memberId);
        List<SpeechInterviewSession> interviews = speechInterviewSessionRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
        QuizStats quizStats = quizStats(memberId);

        List<String> recentTitles = recentTitles(entries, 5);
        InferredRoles inferredRoles = inferRoles(member.getTargetRoles(), recentTitles);
        Map<String, Integer> statusBreakdown = statusBreakdown(entries);

        CoachSummaryResponse summary = new CoachSummaryResponse(
                inferredRoles.roles(),
                inferredRoles.source(),
                new CoachSummaryResponse.Recruitment(
                        entries.size(),
                        statusBreakdown,
                        recentTitles
                ),
                new CoachSummaryResponse.Resume(
                        resumes.size(),
                        lastAnalyzedAt(resumes)
                ),
                new CoachSummaryResponse.Interview(
                        interviews.size(),
                        completedSessions(interviews),
                        averageTurns(interviews)
                ),
                new CoachSummaryResponse.Quiz(
                        quizStats.totalAttempts(),
                        quizStats.topicAccuracy(),
                        quizStats.topicAttempts()
                )
        );

        CoachAiPort.CoachContext context = new CoachAiPort.CoachContext(
                inferredRoles.analysisRoles(),
                entries.size(),
                statusBreakdown,
                resumes.size(),
                daysSinceLastAnalysis(summary.resume().lastAnalyzedAt()),
                summary.interview().completedSessions(),
                summary.interview().totalSessions(),
                quizStats.topicAccuracy(),
                quizStats.totalAttempts()
        );
        return new CoachSnapshot(summary, context);
    }

    private static Map<String, Integer> statusBreakdown(List<RecruitmentEntry> entries) {
        Map<RecruitmentStep, Integer> counts = new EnumMap<>(RecruitmentStep.class);
        for (RecruitmentEntry entry : entries) {
            counts.merge(entry.getStep(), 1, Integer::sum);
        }
        Map<String, Integer> result = new LinkedHashMap<>();
        for (RecruitmentStep step : RecruitmentStep.values()) {
            int count = counts.getOrDefault(step, 0);
            if (count > 0) result.put(step.name(), count);
        }
        return result;
    }

    private static List<String> recentTitles(List<RecruitmentEntry> entries, int limit) {
        return entries.stream()
                .sorted(Comparator
                        .comparing(RecruitmentEntry::getAppliedDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(RecruitmentEntry::getId, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(RecruitmentEntry::getPosition)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(title -> !title.isBlank())
                .distinct()
                .limit(limit)
                .toList();
    }

    private static InferredRoles inferRoles(List<String> memberRoles, List<String> recentTitles) {
        List<String> roles = cleanDistinct(memberRoles, 3);
        if (!roles.isEmpty()) {
            return new InferredRoles(roles, roles, "TARGET_ROLES");
        }
        List<String> jdRoles = cleanDistinct(recentTitles, 3);
        if (!jdRoles.isEmpty()) {
            return new InferredRoles(jdRoles, jdRoles, "JD_ANALYSIS");
        }
        return new InferredRoles(List.of("취업 준비생"), List.of(), "DEFAULT");
    }

    private static List<String> cleanDistinct(List<String> values, int limit) {
        if (values == null || values.isEmpty()) return List.of();
        List<String> result = new ArrayList<>();
        for (String value : values) {
            if (value == null) continue;
            String cleaned = value.trim().replaceAll("\\s+", " ");
            if (cleaned.isBlank() || result.contains(cleaned)) continue;
            result.add(cleaned);
            if (result.size() >= limit) break;
        }
        return List.copyOf(result);
    }

    private static LocalDateTime lastAnalyzedAt(List<Resume> resumes) {
        return resumes.stream()
                .filter(resume -> resume.getExtractStatus() == ResumeExtractStatus.EXTRACTED)
                .map(Resume::getCreatedAt)
                .filter(Objects::nonNull)
                .max(LocalDateTime::compareTo)
                .orElse(null);
    }

    private static int daysSinceLastAnalysis(LocalDateTime lastAnalyzedAt) {
        if (lastAnalyzedAt == null) return -1;
        return (int) ChronoUnit.DAYS.between(lastAnalyzedAt.toLocalDate(), LocalDate.now());
    }

    private static int completedSessions(List<SpeechInterviewSession> interviews) {
        return (int) interviews.stream()
                .filter(session -> session.getStatus() == SpeechInterviewStatus.COMPLETED)
                .count();
    }

    private static double averageTurns(List<SpeechInterviewSession> interviews) {
        if (interviews.isEmpty()) return 0.0;
        double average = interviews.stream()
                .mapToInt(session -> session.getQuestions().size())
                .average()
                .orElse(0.0);
        return Math.round(average * 10.0) / 10.0;
    }

    private QuizStats quizStats(Long memberId) {
        List<Object[]> rows = csQuizSessionRepository.findStatsGroupedByTopic(memberId);
        int totalAttempts = 0;
        Map<String, Double> topicAccuracy = new LinkedHashMap<>();
        Map<String, Integer> topicAttempts = new LinkedHashMap<>();
        for (Object[] row : rows) {
            CsQuizTopic topic = (CsQuizTopic) row[0];
            int topicTotal = ((Long) row[1]).intValue();
            int topicCorrect = ((Long) row[2]).intValue();
            totalAttempts += topicTotal;
            topicAccuracy.put(topic.name(), topicTotal > 0 ? (double) topicCorrect / topicTotal : 0.0);
            topicAttempts.put(topic.name(), topicTotal);
        }
        return new QuizStats(totalAttempts, topicAccuracy, topicAttempts);
    }

    private static String contextHash(CoachAiPort.CoachContext context) {
        String source = String.join("|",
                String.join(",", context.targetRoles()),
                String.valueOf(context.totalApplications()),
                context.statusCounts().toString(),
                String.valueOf(context.interviewCompleted()),
                context.quizAccuracy().toString(),
                String.valueOf(context.quizTotalAttempts())
        );
        try {
            MessageDigest digest = MessageDigest.getInstance("MD5");
            byte[] bytes = digest.digest(source.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("코치 분석 캐시 키 생성에 실패했습니다.", e);
        }
    }

    private record CoachSnapshot(
            CoachSummaryResponse summary,
            CoachAiPort.CoachContext context
    ) {}

    private record InferredRoles(
            List<String> roles,
            List<String> analysisRoles,
            String source
    ) {}

    private record QuizStats(
            int totalAttempts,
            Map<String, Double> topicAccuracy,
            Map<String, Integer> topicAttempts
    ) {}
}
