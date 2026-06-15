import type { CoachSummary } from "@/features/coach/api/types";
import type { DiagnosticResult } from "../api/types";

export function diagnoseBottleneck(summary?: CoachSummary): DiagnosticResult {
  const total = summary?.recruitment.totalApplications ?? 0;
  const counts = summary?.recruitment.statusBreakdown ?? {};
  const interviewCount = (counts.INTERVIEWING ?? 0) + (counts.OFFERED ?? 0);
  const offerCount = counts.OFFERED ?? 0;
  const documentPassRate = total > 0 ? interviewCount / total : 0;
  const interviewConversionRate = interviewCount > 0 ? offerCount / interviewCount : 0;
  const weakQuiz = weakestQuizTopic(summary);

  if (total >= 5 && documentPassRate < 0.1) {
    return {
      type: "RESUME",
      title: "서류 단계가 가장 큰 병목입니다",
      message: `${total}건 지원 중 서류 이후 단계가 ${interviewCount}건입니다. 이력서와 최근 JD의 키워드 연결을 먼저 점검하는 편이 좋습니다.`,
      action: "가장 최근 지원한 JD와 이력서 매칭 분석",
    };
  }

  if (interviewCount >= 3 && interviewConversionRate < 0.2) {
    return {
      type: "INTERVIEW",
      title: "면접 전환 이후 설득력이 약합니다",
      message: `서류 이후 단계는 ${interviewCount}건이지만 합격 단계는 ${offerCount}건입니다. 답변 구조와 근거 사례를 먼저 보강해야 합니다.`,
      action: "AI 모의 면접 시작",
    };
  }

  if (weakQuiz && weakQuiz.accuracy < 0.5) {
    return {
      type: "QUIZ",
      title: `${topicLabel(weakQuiz.topic)} 이해도가 낮습니다`,
      message: `${topicLabel(weakQuiz.topic)} 정답률이 ${Math.round(weakQuiz.accuracy * 100)}%입니다. 면접 전에 약점 주제를 집중적으로 복습하세요.`,
      action: "약점 주제 집중 학습",
    };
  }

  if (total === 0) {
    return {
      type: "EMPTY",
      title: "아직 판단할 지원 데이터가 없습니다",
      message: "지원 현황을 등록하고 이력서를 업로드하면, AI 비서가 병목과 이번 주 우선순위를 더 정확히 잡아줄 수 있습니다.",
      action: "지원 현황 등록 및 이력서 업로드",
    };
  }

  return {
    type: "NONE",
    title: "큰 병목은 아직 보이지 않습니다",
    message: "지원, 이력서, 면접, 퀴즈 데이터를 함께 보면 다음 액션을 더 세밀하게 정할 수 있습니다.",
    action: "전반적인 현황을 AI 비서에게 질문",
  };
}

export function diagnosticAssistantTurn(diagnostic: DiagnosticResult) {
  return `${diagnostic.title}\n\n${diagnostic.message}\n\n추천 액션: ${diagnostic.action}`;
}

function weakestQuizTopic(summary?: CoachSummary) {
  const entries = Object.entries(summary?.quiz.topicAccuracy ?? {})
    .map(([topic, accuracy]) => {
      const attempts = summary?.quiz.topicAttempts?.[topic] ?? 0;
      return { topic, accuracy, attempts };
    })
    .filter((item) => item.attempts >= 10);

  if (!entries.length) return null;
  return entries.sort((a, b) => a.accuracy - b.accuracy)[0];
}

function topicLabel(topic: string) {
  const map: Record<string, string> = {
    OS: "운영체제",
    NETWORK: "네트워크",
    DB: "데이터베이스",
    SPRING: "Spring",
    JAVA: "Java",
    DATA_STRUCTURE: "자료구조",
    ALGORITHM: "알고리즘",
    ARCHITECTURE: "아키텍처",
    CLOUD: "클라우드",
  };
  return map[topic] ?? topic;
}
