import { Suspense } from "react";
import { SpeechInterviewResultPage } from "@/features/speech-interview/components/SpeechInterviewResultPage";

export default function SpeechInterviewResultRoute() {
  return (
    <Suspense>
      <SpeechInterviewResultPage />
    </Suspense>
  );
}

export const metadata = {
  title: "스피치 면접 결과 | Bluehour",
  description: "스피치 면접 결과 및 AI 피드백 확인",
};
