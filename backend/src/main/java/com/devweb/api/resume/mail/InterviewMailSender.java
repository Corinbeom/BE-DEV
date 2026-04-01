package com.devweb.api.resume.mail;

import com.devweb.domain.member.model.Member;
import com.devweb.domain.resume.mail.model.InterviewMailLog;
import com.devweb.domain.resume.mail.model.InterviewMailSchedule;
import com.devweb.domain.resume.mail.port.EmailSenderPort;
import com.devweb.domain.resume.mail.port.InterviewMailLogRepository;
import com.devweb.domain.resume.mail.port.InterviewMailScheduleRepository;
import com.devweb.domain.resume.model.Resume;
import com.devweb.domain.resume.session.model.ResumeQuestion;
import com.devweb.domain.resume.session.service.QuestionGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Component
public class InterviewMailSender {

    private static final Logger log = LoggerFactory.getLogger(InterviewMailSender.class);

    private final InterviewMailScheduleRepository scheduleRepository;
    private final InterviewMailLogRepository logRepository;
    private final QuestionGenerator questionGenerator;
    private final EmailSenderPort emailSender;
    private final ObjectMapper objectMapper;

    public InterviewMailSender(InterviewMailScheduleRepository scheduleRepository,
                                InterviewMailLogRepository logRepository,
                                QuestionGenerator questionGenerator,
                                EmailSenderPort emailSender,
                                ObjectMapper objectMapper) {
        this.scheduleRepository = scheduleRepository;
        this.logRepository = logRepository;
        this.questionGenerator = questionGenerator;
        this.emailSender = emailSender;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public void sendForMember(Long memberId) {
        InterviewMailSchedule schedule = scheduleRepository.findByMemberId(memberId)
                .orElseThrow(() -> new IllegalArgumentException("설정된 메일 스케줄이 없습니다."));
        sendForSchedule(schedule);
    }

    @Transactional
    public void sendForSchedule(InterviewMailSchedule schedule) {
        Resume resume = schedule.getResume();
        Member member = schedule.getMember();

        String resumeText = resume.getExtractedText();
        if (resumeText == null || resumeText.isBlank()) {
            log.warn("이력서 텍스트가 비어있어 메일을 발송하지 않습니다. scheduleId={}", schedule.getId());
            return;
        }

        List<String> previousQuestions = loadPreviousQuestions(schedule.getId());

        List<ResumeQuestion> questions = questionGenerator.generate(
                schedule.getPositionType(),
                resumeText,
                null, null,
                schedule.getTargetTechnologies(),
                previousQuestions
        );

        if (questions.isEmpty()) {
            log.warn("생성된 질문이 없어 메일을 발송하지 않습니다. scheduleId={}", schedule.getId());
            return;
        }

        String htmlBody = buildHtmlEmail(questions, resume.getTitle(), schedule.getPositionType().name());
        String subject = "[DevWeb] 오늘의 면접 질문 - " + resume.getTitle();

        emailSender.send(member.getEmail(), subject, htmlBody);

        List<String> questionTexts = questions.stream()
                .map(q -> q.getInterviewQuestion().getQuestion())
                .toList();
        String questionsJson;
        try {
            questionsJson = objectMapper.writeValueAsString(questionTexts);
        } catch (JsonProcessingException e) {
            questionsJson = "[]";
        }

        InterviewMailLog mailLog = new InterviewMailLog(schedule, questions.size(), questionsJson);
        logRepository.save(mailLog);

        log.info("면접 질문 메일 발송 완료: memberId={}, questionCount={}", member.getId(), questions.size());
    }

    private List<String> loadPreviousQuestions(Long scheduleId) {
        List<String> allJsons = logRepository.findAllQuestionsJsonByScheduleId(scheduleId);
        List<String> result = new ArrayList<>();
        for (String json : allJsons) {
            try {
                List<String> questions = objectMapper.readValue(json, new TypeReference<>() {});
                result.addAll(questions);
            } catch (JsonProcessingException e) {
                log.warn("이전 질문 JSON 파싱 실패: {}", json, e);
            }
            if (result.size() >= 50) break;
        }
        return result.size() > 50 ? result.subList(0, 50) : result;
    }

    private String buildHtmlEmail(List<ResumeQuestion> questions, String resumeTitle, String positionType) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"></head>
                <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1a1a1a;">
                <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px;border-radius:12px;color:white;margin-bottom:24px;">
                  <h1 style="margin:0 0 8px;font-size:22px;">오늘의 면접 질문</h1>
                  <p style="margin:0;opacity:0.9;font-size:14px;">%s · %s</p>
                </div>
                """.formatted(escapeHtml(resumeTitle), escapeHtml(positionType)));

        int idx = 1;
        for (ResumeQuestion q : questions) {
            sb.append("""
                <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:16px;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="background:#6366f1;color:white;border-radius:50%%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:bold;">%d</span>
                    <span style="background:#f3f4f6;padding:2px 8px;border-radius:4px;font-size:12px;color:#6b7280;">%s</span>
                    <span style="font-size:12px;color:#6b7280;">출제확률 %d%%</span>
                  </div>
                  <p style="font-size:15px;font-weight:600;margin:0 0 8px;">%s</p>
                  <p style="font-size:13px;color:#6b7280;margin:0 0 4px;"><strong>출제 의도:</strong> %s</p>
                  <p style="font-size:13px;color:#6b7280;margin:0 0 4px;"><strong>키워드:</strong> %s</p>
                  <details style="margin-top:8px;">
                    <summary style="cursor:pointer;font-size:13px;color:#6366f1;font-weight:600;">모범 답안 보기</summary>
                    <p style="font-size:13px;color:#374151;margin:8px 0 0;padding:12px;background:#f9fafb;border-radius:6px;">%s</p>
                  </details>
                </div>
                """.formatted(
                    idx++,
                    escapeHtml(q.getBadge()),
                    q.getLikelihood(),
                    escapeHtml(q.getInterviewQuestion().getQuestion()),
                    escapeHtml(q.getInterviewQuestion().getIntention()),
                    escapeHtml(q.getInterviewQuestion().getKeywords()),
                    escapeHtml(q.getInterviewQuestion().getModelAnswer())
            ));
        }

        sb.append("""
                <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;margin-top:24px;">
                  <p>이 메일은 DevWeb에서 자동 발송되었습니다.</p>
                </div>
                </body>
                </html>
                """);

        return sb.toString();
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
