"use client";

import { useEffect, useState } from "react";
import { createMember, getMember } from "../api/memberApi";

const STORAGE_KEY = "devweb:memberId";

export function useDevMemberId() {
  const [memberId, setMemberId] = useState<number | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = Number(raw);
          if (!Number.isNaN(parsed) && parsed > 0) {
            try {
              // 백엔드를 재기동(H2 in-memory)하면 기존 memberId가 사라질 수 있음
              await getMember(parsed);
              if (!cancelled) setMemberId(parsed);
              return;
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              // 멤버가 없으면(404) 저장된 값을 폐기하고 새로 생성한다.
              if (msg.startsWith("HTTP 404")) {
                localStorage.removeItem(STORAGE_KEY);
              } else {
                throw e;
              }
            }
          }
        }

        const email = `dev+${Date.now()}@devweb.local`;
        const created = await createMember(email);
        if (cancelled) return;
        localStorage.setItem(STORAGE_KEY, String(created.id));
        setMemberId(created.id);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "알 수 없는 오류");
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return { memberId, isBootstrapping, error };
}


