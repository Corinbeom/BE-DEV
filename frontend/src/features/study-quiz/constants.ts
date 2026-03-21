import type { CsQuizDifficulty, CsQuizTopic } from "./api/types";

export const TOPICS: { id: CsQuizTopic; label: string; icon: string }[] = [
  { id: "OS", label: "운영체제", icon: "memory" },
  { id: "NETWORK", label: "네트워크", icon: "lan" },
  { id: "DB", label: "데이터베이스", icon: "database" },
  { id: "SPRING", label: "Spring", icon: "eco" },
  { id: "JAVA", label: "Java", icon: "coffee" },
  { id: "DATA_STRUCTURE", label: "자료구조", icon: "account_tree" },
  { id: "ALGORITHM", label: "알고리즘", icon: "functions" },
  { id: "ARCHITECTURE", label: "아키텍처 설계", icon: "architecture" },
  { id: "CLOUD", label: "클라우드 설계", icon: "cloud" },
];

export const DIFFICULTIES: { id: CsQuizDifficulty; label: string; color: string }[] = [
  { id: "LOW", label: "하", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" },
  { id: "MID", label: "중", color: "text-amber-600 bg-amber-500/10 border-amber-500/30" },
  { id: "HIGH", label: "상", color: "text-red-600 bg-red-500/10 border-red-500/30" },
];

export const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t.label])
);

export const DIFFICULTY_META: Record<string, { label: string; color: string }> = Object.fromEntries(
  DIFFICULTIES.map((d) => [d.id, { label: d.label, color: d.color }])
);
