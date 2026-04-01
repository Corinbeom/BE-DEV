package com.devweb.api.resume.mail;

import com.devweb.api.resume.mail.dto.InterviewMailScheduleResponse;
import com.devweb.api.resume.mail.dto.UpsertInterviewMailScheduleRequest;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Interview Mail Schedule", description = "면접 질문 자동 메일 스케줄 관리")
@RestController
@RequestMapping("/api/interview-mail-schedule")
public class InterviewMailScheduleController {

    private final InterviewMailScheduleService scheduleService;
    private final InterviewMailSender mailSender;

    public InterviewMailScheduleController(InterviewMailScheduleService scheduleService,
                                            InterviewMailSender mailSender) {
        this.scheduleService = scheduleService;
        this.mailSender = mailSender;
    }

    @Operation(summary = "내 스케줄 조회")
    @GetMapping
    public ApiResponse<InterviewMailScheduleResponse> get() {
        Long memberId = AuthUtils.currentMemberId();
        return scheduleService.getByMemberId(memberId)
                .map(ApiResponse::success)
                .orElseGet(() -> ApiResponse.success(null));
    }

    @Operation(summary = "스케줄 생성 또는 수정 (upsert)")
    @PutMapping
    public ApiResponse<InterviewMailScheduleResponse> upsert(
            @Valid @RequestBody UpsertInterviewMailScheduleRequest request) {
        Long memberId = AuthUtils.currentMemberId();
        InterviewMailScheduleResponse response = scheduleService.upsert(memberId, request);
        return ApiResponse.success(response);
    }

    @Operation(summary = "스케줄 삭제")
    @DeleteMapping
    public ApiResponse<Void> delete() {
        Long memberId = AuthUtils.currentMemberId();
        scheduleService.delete(memberId);
        return ApiResponse.ok();
    }

    @Operation(summary = "테스트 메일 즉시 발송")
    @PostMapping("/test")
    public ApiResponse<Void> sendTest() {
        Long memberId = AuthUtils.currentMemberId();
        mailSender.sendForMember(memberId);
        return ApiResponse.ok();
    }
}
