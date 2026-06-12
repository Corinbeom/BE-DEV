package com.bluehour.api.member.dto;

import java.util.List;

public record UpdateTargetRolesRequest(
        List<String> targetRoles
) {
}
