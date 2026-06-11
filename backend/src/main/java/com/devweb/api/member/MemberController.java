package com.devweb.api.member;

import com.devweb.api.member.dto.CreateMemberRequest;
import com.devweb.api.member.dto.MemberResponse;
import com.devweb.api.member.dto.UpdateTargetRolesRequest;
import com.devweb.common.ApiResponse;
import com.devweb.common.AuthUtils;
import com.devweb.domain.member.model.Member;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@Tag(name = "회원", description = "회원 생성 및 조회")
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    @Operation(summary = "회원 생성", description = "이메일로 새 회원을 생성합니다.")
    @PostMapping
    public ApiResponse<MemberResponse> create(@Valid @RequestBody CreateMemberRequest req) {
        Member created = service.create(req.email());
        return ApiResponse.success(MemberResponse.from(created));
    }

    @Operation(summary = "회원 조회", description = "ID로 회원 정보를 조회합니다.")
    @GetMapping("/{id}")
    public ApiResponse<MemberResponse> get(@PathVariable Long id) {
        return ApiResponse.success(MemberResponse.from(service.get(id)));
    }

    @Operation(summary = "회원 삭제", description = "ID로 회원을 삭제합니다.")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ApiResponse.ok();
    }

    @Operation(summary = "내 관심 직무 수정", description = "현재 로그인한 회원의 관심 직무를 최대 3개까지 저장합니다.")
    @PatchMapping("/me/target-roles")
    public ApiResponse<MemberResponse> updateMyTargetRoles(@RequestBody UpdateTargetRolesRequest req) {
        Member updated = service.updateTargetRoles(AuthUtils.currentMemberId(), req.targetRoles());
        return ApiResponse.success(MemberResponse.from(updated));
    }
}

