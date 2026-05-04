package com.devweb.api.speechinterview;

import com.devweb.api.speechinterview.dto.ChatRequest;
import com.devweb.api.speechinterview.dto.ChatResponse;
import com.devweb.api.speechinterview.dto.CreateSpeechInterviewRequest;
import com.devweb.api.speechinterview.dto.SpeechInterviewResponse;
import com.devweb.api.speechinterview.dto.SubmitSpeechAnswerRequest;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.domain.speechinterview.model.SpeechInterviewSession;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "스피치 면접", description = "AI 스피치 면접 세션 생성 및 답변 관리")
@RestController
@RequestMapping("/api/speech-interviews")
public class SpeechInterviewController {

    private final SpeechInterviewService service;

    public SpeechInterviewController(SpeechInterviewService service) {
        this.service = service;
    }

    @Operation(summary = "스피치 면접 세션 생성", description = "ResumeSession의 질문을 스냅샷 복사하여 새 세션을 생성합니다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<SpeechInterviewResponse> create(
            @Valid @RequestBody CreateSpeechInterviewRequest req
    ) {
        Long memberId = AuthUtils.currentMemberId();
        SpeechInterviewSession session = service.createSession(memberId, req);
        return ApiResponse.success(SpeechInterviewResponse.from(session));
    }

    @Operation(summary = "답변 제출", description = "질문에 대한 답변과 행동 분석 지표를 제출합니다. AI 피드백은 비동기로 생성됩니다.")
    @PostMapping("/{id}/answers")
    public ApiResponse<SpeechInterviewResponse> submitAnswer(
            @PathVariable Long id,
            @Valid @RequestBody SubmitSpeechAnswerRequest req
    ) {
        Long memberId = AuthUtils.currentMemberId();
        SpeechInterviewSession session = service.submitAnswer(memberId, id, req);
        return ApiResponse.success(SpeechInterviewResponse.from(session));
    }

    @Operation(summary = "세션 완료 처리")
    @PostMapping("/{id}/complete")
    public ApiResponse<SpeechInterviewResponse> complete(@PathVariable Long id) {
        Long memberId = AuthUtils.currentMemberId();
        SpeechInterviewSession session = service.completeSession(memberId, id);
        return ApiResponse.success(SpeechInterviewResponse.from(session));
    }

    @Operation(summary = "대화형 면접 턴 처리", description = "사용자 답변을 받아 AI 면접관의 다음 질문을 반환합니다. 첫 턴에는 userMessage를 빈 문자열로 전송하세요.")
    @PostMapping("/{id}/chat")
    public ApiResponse<ChatResponse> chat(
            @PathVariable Long id,
            @Valid @RequestBody ChatRequest req
    ) {
        Long memberId = AuthUtils.currentMemberId();
        ChatResponse response = service.chat(memberId, id, req);
        return ApiResponse.success(response);
    }

    @Operation(summary = "내 세션 목록 조회")
    @GetMapping
    public ApiResponse<List<SpeechInterviewResponse>> list() {
        Long memberId = AuthUtils.currentMemberId();
        List<SpeechInterviewResponse> responses = service.listSessions(memberId).stream()
                .map(SpeechInterviewResponse::from)
                .toList();
        return ApiResponse.success(responses);
    }

    @Operation(summary = "세션 상세 조회", description = "질문 + 답변 + 피드백 + 행동 분석 지표를 모두 반환합니다.")
    @GetMapping("/{id}")
    public ApiResponse<SpeechInterviewResponse> get(@PathVariable Long id) {
        Long memberId = AuthUtils.currentMemberId();
        SpeechInterviewSession session = service.getSession(memberId, id);
        return ApiResponse.success(SpeechInterviewResponse.from(session));
    }
}
