package com.devweb.api.member;

import com.devweb.api.member.dto.CreateMemberRequest;
import com.devweb.api.member.dto.MemberResponse;
import com.devweb.common.ApiResponse;
import com.devweb.domain.member.model.Member;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService service;

    public MemberController(MemberService service) {
        this.service = service;
    }

    @PostMapping
    public ApiResponse<MemberResponse> create(@Valid @RequestBody CreateMemberRequest req) {
        Member created = service.create(req.email());
        return ApiResponse.success(MemberResponse.from(created));
    }

    @GetMapping("/{id}")
    public ApiResponse<MemberResponse> get(@PathVariable Long id) {
        return ApiResponse.success(MemberResponse.from(service.get(id)));
    }
}


