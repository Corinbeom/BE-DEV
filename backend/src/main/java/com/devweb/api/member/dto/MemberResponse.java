package com.devweb.api.member.dto;

import com.devweb.domain.member.model.Member;

public record MemberResponse(
        Long id,
        String email
) {
    public static MemberResponse from(Member member) {
        return new MemberResponse(member.getId(), member.getEmail());
    }
}


