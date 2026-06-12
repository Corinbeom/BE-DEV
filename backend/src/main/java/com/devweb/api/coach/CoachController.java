package com.devweb.api.coach;

import com.devweb.api.coach.dto.CoachAnalysisResponse;
import com.devweb.api.coach.dto.CoachSummaryResponse;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "AI 코치", description = "취업 코치 요약 및 분석 API")
@RestController
@RequestMapping("/api/coach")
public class CoachController {

    private final CoachService coachService;

    public CoachController(CoachService coachService) {
        this.coachService = coachService;
    }

    @Operation(summary = "코치 요약 조회", description = "지원, 이력서, 면접, 퀴즈 현황을 집계합니다.")
    @GetMapping("/summary")
    public ApiResponse<CoachSummaryResponse> summary() {
        return ApiResponse.success(coachService.getSummary(AuthUtils.currentMemberId()));
    }

    @Operation(summary = "AI 코치 분석 조회", description = "집계 지표 기반 준비도와 오늘 할 일을 반환합니다.")
    @GetMapping("/analysis")
    public ApiResponse<CoachAnalysisResponse> analysis() {
        return ApiResponse.success(coachService.getAnalysis(AuthUtils.currentMemberId()));
    }

    @Operation(summary = "AI 코치 분석 새로고침", description = "코치 캐시를 무효화하고 분석을 다시 생성합니다.")
    @PostMapping("/refresh")
    public ApiResponse<CoachAnalysisResponse> refresh() {
        return ApiResponse.success(coachService.refresh(AuthUtils.currentMemberId()));
    }
}
