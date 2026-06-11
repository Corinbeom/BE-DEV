package com.devweb.api.member.dto;

import java.util.List;

public record UpdateTargetRolesRequest(
        List<String> targetRoles
) {
}
