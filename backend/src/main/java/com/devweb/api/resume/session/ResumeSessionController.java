package com.devweb.api.resume.session;

import com.devweb.api.resume.session.dto.CreateResumeSessionRequest;
import com.devweb.api.resume.session.dto.ResumeInterviewStatsResponse;
import com.devweb.api.resume.session.dto.ResumeSessionResponse;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.domain.resume.session.model.ResumeSession;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "이력서 분석 세션", description = "이력서 기반 AI 면접 질문 생성 세션")
@RestController
@RequestMapping("/api/resume-sessions")
public class ResumeSessionController {

    private final ResumeSessionService service;

    public ResumeSessionController(ResumeSessionService service) {
        this.service = service;
    }

    @Operation(summary = "면접 연습 통계 조회", description = "배지별 강점/개선점 통계를 조회합니다.")
    @GetMapping("/stats")
    public ApiResponse<ResumeInterviewStatsResponse> interviewStats() {
        Long memberId = AuthUtils.currentMemberId();
        return ApiResponse.success(service.getInterviewStats(memberId));
    }

    @Operation(summary = "내 세션 목록 조회", description = "로그인한 사용자의 이력서 분석 세션 목록을 조회합니다.")
    @GetMapping
    public ApiResponse<List<ResumeSessionResponse>> listByCurrentMember() {
        Long memberId = AuthUtils.currentMemberId();
        return ApiResponse.success(service.listByMemberCached(memberId));
    }

    @Operation(summary = "분석 세션 생성", description = "업로드된 이력서를 기반으로 AI 면접 질문을 생성합니다.")
    @PostMapping
    public ApiResponse<ResumeSessionResponse> create(@Valid @RequestBody CreateResumeSessionRequest request) {
        Long memberId = AuthUtils.currentMemberId();
        ResumeSession created = service.createFromResume(
                memberId,
                request.positionType(),
                request.title(),
                request.resumeId(),
                request.portfolioResumeId(),
                request.portfolioUrl(),
                request.targetTechnologies()
        );
        return ApiResponse.success(ResumeSessionResponse.from(created));
    }

    @Operation(summary = "세션 상세 조회", description = "세션 ID로 면접 질문 포함 세션 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ApiResponse<ResumeSessionResponse> get(@PathVariable Long id) {
        return ApiResponse.success(ResumeSessionResponse.from(service.get(id)));
    }

    @Operation(summary = "세션 완료 처리", description = "현재 세션을 종료 상태(COMPLETED)로 전환합니다. 미답변 질문이 있어도 종료할 수 있습니다.")
    @PostMapping("/{id}/complete")
    public ApiResponse<ResumeSessionResponse> complete(@PathVariable Long id) {
        Long memberId = AuthUtils.currentMemberId();
        ResumeSession completed = service.complete(id, memberId);
        return ApiResponse.success(ResumeSessionResponse.from(completed));
    }

    @Operation(summary = "세션 삭제", description = "이력서 분석 세션을 삭제합니다.")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.success(null);
    }
}
