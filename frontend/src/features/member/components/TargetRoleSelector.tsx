"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const ROLE_GROUPS = [
  {
    category: "개발",
    roles: ["프론트엔드 개발자", "백엔드 개발자", "풀스택 개발자", "iOS 개발자", "Android 개발자", "데이터 엔지니어", "DevOps 엔지니어"],
  },
  {
    category: "디자인",
    roles: ["UX/UI 디자이너", "그래픽 디자이너", "브랜드 디자이너"],
  },
  {
    category: "기획",
    roles: ["프로덕트 매니저", "서비스 기획자", "콘텐츠 기획자"],
  },
  {
    category: "마케팅",
    roles: ["디지털 마케터", "퍼포먼스 마케터", "브랜드 마케터"],
  },
  {
    category: "데이터",
    roles: ["데이터 분석가", "데이터 사이언티스트"],
  },
] as const;

const MAX_ROLES = 3;

function normalizeRole(role: string) {
  return role.trim().replace(/\s+/g, " ");
}

type Props = {
  value: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
};

export function TargetRoleSelector({ value, onChange, disabled = false }: Props) {
  const [customRole, setCustomRole] = useState("");
  const normalized = useMemo(() => value.map(normalizeRole).filter(Boolean), [value]);
  const isFull = normalized.length >= MAX_ROLES;

  function toggleRole(role: string) {
    const nextRole = normalizeRole(role);
    if (!nextRole || disabled) return;
    if (normalized.includes(nextRole)) {
      onChange(normalized.filter((item) => item !== nextRole));
      return;
    }
    if (isFull) return;
    onChange([...normalized, nextRole]);
  }

  function addCustomRole() {
    const nextRole = normalizeRole(customRole);
    if (!nextRole || normalized.includes(nextRole) || isFull || disabled) return;
    onChange([...normalized, nextRole]);
    setCustomRole("");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">관심 직무</p>
        <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">
          {normalized.length}/{MAX_ROLES}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {ROLE_GROUPS.map((group) => (
          <div key={group.category} className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground">{group.category}</p>
            <div className="flex flex-wrap gap-2">
              {group.roles.map((role) => {
                const selected = normalized.includes(role);
                const unavailable = disabled || (!selected && isFull);
                return (
                  <button
                    key={role}
                    type="button"
                    disabled={unavailable}
                    onClick={() => toggleRole(role)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground",
                      unavailable && "cursor-not-allowed opacity-40 hover:border-border hover:text-muted-foreground"
                    )}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={customRole}
          disabled={disabled || isFull}
          maxLength={100}
          onChange={(event) => setCustomRole(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustomRole();
            }
          }}
          placeholder={isFull ? "최대 3개까지 선택할 수 있어요" : "직접 입력"}
          className="h-9 text-sm"
        />
        <button
          type="button"
          disabled={disabled || isFull || !normalizeRole(customRole)}
          onClick={addCustomRole}
          className="shrink-0 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        >
          추가
        </button>
      </div>
    </div>
  );
}
