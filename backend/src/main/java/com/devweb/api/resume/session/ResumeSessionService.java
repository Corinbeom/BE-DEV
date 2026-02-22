package com.devweb.api.resume.session;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.resume.session.model.PositionType;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.model.ResumeSession;
import com.devweb.domain.resume.session.model.StoredFileRef;
import com.devweb.domain.resume.session.port.FileStoragePort;
import com.devweb.domain.resume.session.port.ResumeSessionRepository;
import com.devweb.domain.resume.session.port.TextExtractorPort;
import com.devweb.domain.resume.session.port.UrlTextFetcherPort;
import com.devweb.domain.resume.session.service.QuestionGenerator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ResumeSessionService {

    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024; // 5MB

    private final ResumeSessionRepository sessionRepository;
    private final MemberRepository memberRepository;
    private final FileStoragePort fileStorage;
    private final TextExtractorPort textExtractor;
    private final UrlTextFetcherPort urlTextFetcher;
    private final QuestionGenerator questionGenerator;

    public ResumeSessionService(
            ResumeSessionRepository sessionRepository,
            MemberRepository memberRepository,
            FileStoragePort fileStorage,
            TextExtractorPort textExtractor,
            UrlTextFetcherPort urlTextFetcher,
            QuestionGenerator questionGenerator
    ) {
        this.sessionRepository = sessionRepository;
        this.memberRepository = memberRepository;
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

        List<ResumeQuestion> questions = questionGenerator.generate(positionType, resumeText, portfolioText, portfolioUrl);
        session.markQuestionsReady(questions);

        return sessionRepository.save(session);
    }

    @Transactional(readOnly = true)
    public ResumeSession get(Long id) {
        return sessionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ResumeSession을 찾을 수 없습니다. id=" + id));
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

