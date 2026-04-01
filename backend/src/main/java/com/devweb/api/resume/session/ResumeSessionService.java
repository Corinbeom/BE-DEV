package com.devweb.api.resume.session;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.resume.model.Resume;
import com.devweb.domain.resume.model.ResumeExtractStatus;
import com.devweb.domain.resume.port.ResumeRepository;
import com.devweb.domain.resume.session.model.PositionType;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.model.StoredFileRef;
import com.devweb.domain.resume.session.port.FileStoragePort;
import com.devweb.domain.resume.session.port.ResumeSessionRepository;
import com.devweb.domain.resume.session.port.TextExtractorPort;
import com.devweb.domain.resume.session.port.UrlTextFetcherPort;
import com.devweb.domain.resume.session.service.QuestionGenerator;
import com.devweb.api.resume.session.dto.ResumeInterviewStatsResponse;
import com.devweb.api.resume.session.dto.ResumeInterviewStatsResponse.BadgeStats;
import com.devweb.api.resume.session.dto.ResumeInterviewStatsResponse.FrequentItem;
import com.devweb.api.resume.session.dto.ResumeInterviewStatsResponse.WeeklyTrend;
import com.devweb.api.resume.session.dto.ResumeSessionResponse;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@Transactional
public class ResumeSessionService {

    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024; // 5MB

    private final ResumeSessionRepository sessionRepository;
    private final MemberRepository memberRepository;
    private final ResumeRepository resumeRepository;
    private final FileStoragePort fileStorage;
    private final TextExtractorPort textExtractor;
    private final UrlTextFetcherPort urlTextFetcher;
    private final QuestionGenerator questionGenerator;

    public ResumeSessionService(
            ResumeSessionRepository sessionRepository,
            MemberRepository memberRepository,
            ResumeRepository resumeRepository,
            FileStoragePort fileStorage,
            TextExtractorPort textExtractor,
            UrlTextFetcherPort urlTextFetcher,
            QuestionGenerator questionGenerator
    ) {
        this.sessionRepository = sessionRepository;
        this.memberRepository = memberRepository;
        this.resumeRepository = resumeRepository;
        this.fileStorage = fileStorage;
        this.textExtractor = textExtractor;
        this.urlTextFetcher = urlTextFetcher;
        this.questionGenerator = questionGenerator;
    }

    public ResumeSession create(
            Long memberId,
            String positionTypeRaw,
            String title,
            MultipartFile resumeFile,
            MultipartFile portfolioFile,
            String portfolioUrl
    ) {
        if (resumeFile == null || resumeFile.isEmpty()) throw new IllegalArgumentException("resumeFile은 필수입니다.");
        validateSize(resumeFile);
        if (portfolioFile != null && !portfolioFile.isEmpty()) validateSize(portfolioFile);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));

        PositionType positionType = PositionType.from(positionTypeRaw);
        String resolvedTitle = (title == null || title.isBlank())
                ? (resumeFile.getOriginalFilename() == null ? "resume" : resumeFile.getOriginalFilename())
                : title;

        ResumeSession session = new ResumeSession(member, positionType, resolvedTitle, portfolioUrl);

        byte[] resumeBytes = readBytes(resumeFile);
        StoredFileRef resumeRef = fileStorage.save(resumeBytes, resumeFile.getOriginalFilename(), resumeFile.getContentType());

        byte[] portfolioBytes = null;
        StoredFileRef portfolioRef = null;
        if (portfolioFile != null && !portfolioFile.isEmpty()) {
            portfolioBytes = readBytes(portfolioFile);
            portfolioRef = fileStorage.save(portfolioBytes, portfolioFile.getOriginalFilename(), portfolioFile.getContentType());
        }

        session.attachFiles(resumeRef, portfolioRef);

        String resumeText = textExtractor.extract(resumeBytes, resumeFile.getContentType());
        String portfolioText = buildPortfolioText(portfolioBytes, portfolioFile, portfolioUrl);

        session.markExtracted(resumeText, portfolioText);

        List<ResumeQuestion> questions = questionGenerator.generate(positionType, resumeText, portfolioText, portfolioUrl, List.of());
        session.markQuestionsReady(questions);

        return sessionRepository.save(session);
    }

    public ResumeSession createFromResume(
            Long memberId,
            String positionTypeRaw,
            String title,
            Long resumeId,
            Long portfolioResumeId,
            String portfolioUrl,
            List<String> targetTechnologies
    ) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));

        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume를 찾을 수 없습니다. id=" + resumeId));
        if (resume.getExtractStatus() != ResumeExtractStatus.EXTRACTED) {
            throw new IllegalArgumentException("텍스트 추출이 완료되지 않은 이력서입니다.");
        }

        PositionType positionType = PositionType.from(positionTypeRaw);
        String resolvedTitle = (title == null || title.isBlank()) ? resume.getTitle() : title;

        ResumeSession session = new ResumeSession(member, positionType, resolvedTitle, portfolioUrl);

        StoredFileRef resumeRef = resume.getStoredFile();
        StoredFileRef portfolioRef = null;
        String resumeText = resume.getExtractedText();
        String portfolioText = null;

        if (portfolioResumeId != null) {
            Resume portfolio = resumeRepository.findById(portfolioResumeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Portfolio Resume를 찾을 수 없습니다. id=" + portfolioResumeId));
            if (portfolio.getExtractStatus() == ResumeExtractStatus.EXTRACTED) {
                portfolioRef = portfolio.getStoredFile();
                portfolioText = portfolio.getExtractedText();
            }
        }

        if (portfolioUrl != null && !portfolioUrl.isBlank()) {
            String fromUrl = urlTextFetcher.fetch(portfolioUrl);
            if (fromUrl != null && !fromUrl.isBlank()) {
                portfolioText = portfolioText != null
                        ? portfolioText + "\n\n---\n\n" + fromUrl
                        : fromUrl;
            }
        }

        session.attachFiles(resumeRef, portfolioRef);
        session.markExtracted(resumeText, portfolioText);

        List<String> safeTechs = targetTechnologies != null ? targetTechnologies : List.of();
        List<ResumeQuestion> questions = questionGenerator.generate(positionType, resumeText, portfolioText, portfolioUrl, safeTechs);
        session.markQuestionsReady(questions);

        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public ResumeSession get(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ResumeSession을 찾을 수 없습니다. id=" + id));
    }

    @Transactional(readOnly = true)
    public List<ResumeSession> listByMember(Long memberId) {
        return sessionRepository.findAllByMemberId(memberId);
    }

    @Cacheable(value = "resumeSessions", key = "#memberId")
    @Transactional(readOnly = true)
    public List<ResumeSessionResponse> listByMemberCached(Long memberId) {
        return new java.util.ArrayList<>(sessionRepository.findAllByMemberId(memberId).stream()
                .map(ResumeSessionResponse::from)
                .toList());
    }

    @Cacheable(value = "resumeInterviewStats", key = "#memberId")
    @Transactional(readOnly = true)
    public ResumeInterviewStatsResponse getInterviewStats(Long memberId) {
        List<Object[]> rows = sessionRepository.findInterviewStatsGroupedByBadge(memberId);
        Map<String, Long> strengthsMap = toCountMap(sessionRepository.countStrengthsByBadge(memberId));
        Map<String, Long> improvementsMap = toCountMap(sessionRepository.countImprovementsByBadge(memberId));

        Map<String, List<FrequentItem>> topStrengthsMap = toTopItemsMap(sessionRepository.findTopStrengthsByBadge(memberId));
        Map<String, List<FrequentItem>> topImprovementsMap = toTopItemsMap(sessionRepository.findTopImprovementsByBadge(memberId));

        int totalAll = 0;
        int attemptedAll = 0;
        List<BadgeStats> badgeStatsList = new ArrayList<>();

        for (Object[] row : rows) {
            String badge = (String) row[0];
            int total = ((Number) row[1]).intValue();
            int attempted = ((Number) row[2]).intValue();
            long attemptCount = ((Number) row[3]).longValue();

            double practiceRate = total == 0 ? 0.0 : (double) attempted / total;
            double avgStr = attemptCount == 0 ? 0.0 : (double) strengthsMap.getOrDefault(badge, 0L) / attemptCount;
            double avgImp = attemptCount == 0 ? 0.0 : (double) improvementsMap.getOrDefault(badge, 0L) / attemptCount;

            badgeStatsList.add(new BadgeStats(badge, total, attempted, practiceRate, avgStr, avgImp,
                    topStrengthsMap.getOrDefault(badge, List.of()),
                    topImprovementsMap.getOrDefault(badge, List.of())));
            totalAll += total;
            attemptedAll += attempted;
        }

        List<WeeklyTrend> weeklyTrends = buildWeeklyTrends(memberId);

        double overallPracticeRate = totalAll == 0 ? 0.0 : (double) attemptedAll / totalAll;
        return new ResumeInterviewStatsResponse(totalAll, attemptedAll, overallPracticeRate, badgeStatsList, weeklyTrends);
    }

    private static Map<String, Long> toCountMap(List<Object[]> rows) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((String) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }

    /**
     * SQL 결과가 badge, text, freq DESC 순 정렬이므로 badge별 첫 3개만 수집.
     */
    private static Map<String, List<FrequentItem>> toTopItemsMap(List<Object[]> rows) {
        Map<String, List<FrequentItem>> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String badge = (String) row[0];
            String text = (String) row[1];
            int freq = ((Number) row[2]).intValue();
            List<FrequentItem> items = map.computeIfAbsent(badge, k -> new ArrayList<>());
            if (items.size() < 3) {
                items.add(new FrequentItem(text, freq));
            }
        }
        return map;
    }

    private List<WeeklyTrend> buildWeeklyTrends(Long memberId) {
        Map<LocalDate, Long> dailyAttempts = toDailyMap(sessionRepository.findDailyAttemptCounts(memberId));
        Map<LocalDate, Long> dailyStrengths = toDailyMap(sessionRepository.findDailyStrengthCounts(memberId));
        Map<LocalDate, Long> dailyImprovements = toDailyMap(sessionRepository.findDailyImprovementCounts(memberId));

        // 모든 날짜를 모아서 주간(ISO Monday)으로 그룹
        TreeMap<LocalDate, long[]> weeklyAgg = new TreeMap<>(); // weekStart → [attempts, strengths, improvements]

        for (LocalDate date : dailyAttempts.keySet()) {
            collectWeek(weeklyAgg, date);
        }
        for (LocalDate date : dailyStrengths.keySet()) {
            collectWeek(weeklyAgg, date);
        }
        for (LocalDate date : dailyImprovements.keySet()) {
            collectWeek(weeklyAgg, date);
        }

        for (var entry : dailyAttempts.entrySet()) {
            LocalDate monday = entry.getKey().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            weeklyAgg.get(monday)[0] += entry.getValue();
        }
        for (var entry : dailyStrengths.entrySet()) {
            LocalDate monday = entry.getKey().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            weeklyAgg.get(monday)[1] += entry.getValue();
        }
        for (var entry : dailyImprovements.entrySet()) {
            LocalDate monday = entry.getKey().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            weeklyAgg.get(monday)[2] += entry.getValue();
        }

        DateTimeFormatter fmt = DateTimeFormatter.ISO_LOCAL_DATE;
        List<WeeklyTrend> trends = new ArrayList<>();
        for (var entry : weeklyAgg.entrySet()) {
            long[] vals = entry.getValue();
            long attempts = vals[0];
            double avgStr = attempts == 0 ? 0.0 : (double) vals[1] / attempts;
            double avgImp = attempts == 0 ? 0.0 : (double) vals[2] / attempts;
            trends.add(new WeeklyTrend(entry.getKey().format(fmt), (int) attempts, avgStr, avgImp));
        }
        return trends;
    }

    private static void collectWeek(TreeMap<LocalDate, long[]> weeklyAgg, LocalDate date) {
        LocalDate monday = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        weeklyAgg.computeIfAbsent(monday, k -> new long[3]);
    }

    private static Map<LocalDate, Long> toDailyMap(List<Object[]> rows) {
        Map<LocalDate, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            LocalDate date;
            if (row[0] instanceof java.sql.Date sqlDate) {
                date = sqlDate.toLocalDate();
            } else {
                date = LocalDate.parse(row[0].toString());
            }
            map.put(date, ((Number) row[1]).longValue());
        }
        return map;
    }

    @CacheEvict(value = {"resumeSessions", "resumeInterviewStats"}, allEntries = true)
    public void delete(Long id) {
        get(id);
        sessionRepository.deleteById(id);
    }

    private static void validateSize(MultipartFile file) {
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException("파일 크기는 최대 5MB 입니다. filename=" + file.getOriginalFilename());
        }
    }

    private static byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("파일을 읽을 수 없습니다. filename=" + file.getOriginalFilename(), e);
        }
    }

    private String buildPortfolioText(byte[] portfolioBytes, MultipartFile portfolioFile, String portfolioUrl) {
        List<String> parts = new ArrayList<>();

        if (portfolioBytes != null && portfolioFile != null && !portfolioFile.isEmpty()) {
            parts.add(textExtractor.extract(portfolioBytes, portfolioFile.getContentType()));
        }

        if (portfolioUrl != null && !portfolioUrl.isBlank()) {
            String fromUrl = urlTextFetcher.fetch(portfolioUrl);
            if (fromUrl != null && !fromUrl.isBlank()) parts.add(fromUrl);
        }

        if (parts.isEmpty()) return null;
        return String.join("\n\n---\n\n", parts);
    }
}

