"use client";

import { useEffect, useState } from "react";
import { createMember } from "../api/memberApi";

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
            if (!cancelled) setMemberId(parsed);
            return;
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


