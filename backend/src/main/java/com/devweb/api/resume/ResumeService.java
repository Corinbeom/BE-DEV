package com.devweb.api.resume;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import com.devweb.domain.resume.model.Resume;
import com.devweb.domain.resume.model.ResumeFileType;
import com.devweb.domain.resume.port.ResumeRepository;
import com.devweb.domain.resume.session.model.StoredFileRef;
import com.devweb.domain.resume.session.port.FileStoragePort;
import com.devweb.domain.resume.session.port.TextExtractorPort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.context.event.EventListener;
import com.devweb.domain.member.event.MemberDeletedEvent;

import java.io.IOException;
import java.util.List;

@Service
@Transactional
public class ResumeService {

    private static final long MAX_FILE_BYTES = 5L * 1024 * 1024;

    private final ResumeRepository resumeRepository;
    private final MemberRepository memberRepository;
    private final FileStoragePort fileStorage;
    private final TextExtractorPort textExtractor;

    public ResumeService(
            ResumeRepository resumeRepository,
            MemberRepository memberRepository,
            FileStoragePort fileStorage,
            TextExtractorPort textExtractor
    ) {
        this.resumeRepository = resumeRepository;
        this.memberRepository = memberRepository;
        this.fileStorage = fileStorage;
        this.textExtractor = textExtractor;
    }

    public Resume upload(Long memberId, MultipartFile file, ResumeFileType fileType, String title) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("파일은 필수입니다.");
        }
        if (file.getSize() > MAX_FILE_BYTES) {
            throw new IllegalArgumentException("파일 크기는 최대 5MB 입니다.");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member를 찾을 수 없습니다. id=" + memberId));

        String resolvedTitle = (title == null || title.isBlank())
                ? (file.getOriginalFilename() != null ? file.getOriginalFilename() : "untitled")
                : title;

        Resume resume = new Resume(member, resolvedTitle, fileType);

        byte[] bytes = readBytes(file);
        StoredFileRef storedFile = fileStorage.save(bytes, file.getOriginalFilename(), file.getContentType());
        resume.attachFile(storedFile);

        try {
            String extractedText = textExtractor.extract(bytes, file.getContentType());
            resume.markExtracted(extractedText);
        } catch (Exception e) {
            resume.markExtractFailed();
        }

        return resumeRepository.save(resume);
    }

    @Transactional(readOnly = true)
    public List<Resume> listByMember(Long memberId) {
        return resumeRepository.findAllByMemberId(memberId);
    }

    @Transactional(readOnly = true)
    public Resume get(Long id) {
        return resumeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resume를 찾을 수 없습니다. id=" + id));
    }

    public void delete(Long memberId, Long resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume를 찾을 수 없습니다. id=" + resumeId));
        if (!resume.getMember().getId().equals(memberId)) {
            throw new IllegalArgumentException("본인의 파일만 삭제할 수 있습니다.");
        }
        String storageKey = resume.getStoredFile() != null ? resume.getStoredFile().getStorageKey() : null;
        resumeRepository.delete(resume);
        if (storageKey != null) {
            fileStorage.delete(storageKey);
        }
    }

    private static byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("파일을 읽을 수 없습니다.", e);
        }
    }

    @EventListener
    public void onMemberDeleted(MemberDeletedEvent event) {
        listByMember(event.memberId()).forEach(resume -> delete(event.memberId(), resume.getId()));
    }
}
