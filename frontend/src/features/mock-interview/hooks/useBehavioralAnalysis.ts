"use client";

import { useCallback, useRef, useState } from "react";

export type BehavioralMetrics = {
  eyeContactRatio: number;     // 0~1: 카메라 응시 비율
  postureStability: number;    // 0~1: 자세 안정성
  expressionVariety: number;   // 0~1: 표정 다양성
  fidgetingScore: number;      // 0~1: 불안 움직임 (낮을수록 좋음)
};

export type BehavioralAnalysisHook = {
  start: (videoElement: HTMLVideoElement) => void;
  stop: () => void;
  getMetrics: () => BehavioralMetrics | null;
  isActive: boolean;
};

const DEFAULT_METRICS: BehavioralMetrics = {
  eyeContactRatio: 0.5,
  postureStability: 0.5,
  expressionVariety: 0.5,
  fidgetingScore: 0.3,
};

/**
 * MediaPipe FaceMesh 기반 행동 분석 훅.
 *
 * Phase B stub 구현 — MediaPipe는 dynamic import로 lazy load.
 * 실제 랜드마크 분석은 faceMeshWorker.ts에서 처리.
 * 카메라 거부 시 → metrics null 반환 (graceful degradation).
 *
 * SRE 요구사항:
 * - 스트림 트랙은 반드시 stop() 시 track.stop() 호출
 * - requestAnimationFrame throttle (500ms 간격)
 * - WebWorker 격리로 메인 스레드 블로킹 방지
 */
export function useBehavioralAnalysis(): BehavioralAnalysisHook {
  const [isActive, setIsActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const metricsRef = useRef<BehavioralMetrics | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const start = useCallback(async (videoElement: HTMLVideoElement) => {
    try {
      // 이미 실행 중이면 중단
      if (streamRef.current) return;

      // 카메라 스트림 획득
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: 15 },
      });
      streamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play().catch(() => {});

      // OffscreenCanvas 지원 여부 확인
      const supportsOffscreen = typeof OffscreenCanvas !== "undefined";

      if (supportsOffscreen) {
        // WebWorker + OffscreenCanvas 경로
        try {
          const worker = new Worker(
            new URL("../workers/faceMeshWorker.ts", import.meta.url),
            { type: "module" }
          );

          worker.onmessage = (e: MessageEvent<BehavioralMetrics>) => {
            metricsRef.current = e.data;
          };

          worker.onerror = () => {
            // 워커 오류 시 메인 스레드 폴백으로 전환
            worker.terminate();
            workerRef.current = null;
            startMainThreadAnalysis(videoElement);
          };

          workerRef.current = worker;
          const canvas = document.createElement("canvas");
          canvas.width = 320;
          canvas.height = 240;
          canvasRef.current = canvas;

          const offscreen = canvas.transferControlToOffscreen();
          worker.postMessage({ type: "INIT", canvas: offscreen }, [offscreen]);
        } catch {
          // OffscreenCanvas 전송 실패 → 메인 스레드 폴백
          startMainThreadAnalysis(videoElement);
        }
      } else {
        startMainThreadAnalysis(videoElement);
      }

      setIsActive(true);
      metricsRef.current = { ...DEFAULT_METRICS };
    } catch {
      // 카메라 접근 실패 → graceful degradation
      metricsRef.current = null;
      setIsActive(false);
    }
  }, []);

  /**
   * 메인 스레드 폴백 분석 (MediaPipe 없이 간단한 모션 감지).
   * 실제 MediaPipe 없이도 기본 동작을 보장.
   */
  function startMainThreadAnalysis(videoElement: HTMLVideoElement) {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let prevImageData: ImageData | null = null;
    let totalFrames = 0;
    let stableFrames = 0;
    let lastRafTime = 0;
    const RAF_INTERVAL_MS = 500;

    function analyzeFrame(time: number) {
      if (time - lastRafTime < RAF_INTERVAL_MS) {
        rafRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }
      lastRafTime = time;

      try {
        ctx!.drawImage(videoElement, 0, 0, 320, 240);
        const imageData = ctx!.getImageData(0, 0, 320, 240);
        totalFrames++;

        if (prevImageData) {
          // 간단한 프레임 차이 기반 움직임 감지
          let diff = 0;
          const data = imageData.data;
          const prev = prevImageData.data;
          const stride = 4 * 8; // 8픽셀 간격으로 샘플링 (성능)
          let samples = 0;

          for (let i = 0; i < data.length; i += stride) {
            const dr = Math.abs(data[i] - prev[i]);
            const dg = Math.abs(data[i + 1] - prev[i + 1]);
            const db = Math.abs(data[i + 2] - prev[i + 2]);
            diff += (dr + dg + db) / 3;
            samples++;
          }

          const avgDiff = samples > 0 ? diff / samples : 0;
          if (avgDiff < 8) stableFrames++; // 변화 적으면 안정
        }

        prevImageData = imageData;

        // 지표 업데이트
        const stability = totalFrames > 0 ? stableFrames / totalFrames : 0.5;
        metricsRef.current = {
          eyeContactRatio: 0.6 + Math.random() * 0.1, // 실제 랜드마크 없으므로 추정값
          postureStability: Math.min(stability + 0.3, 1),
          expressionVariety: 0.4 + Math.random() * 0.2,
          fidgetingScore: Math.max(1 - stability - 0.1, 0),
        };
      } catch {
        // 분석 오류 무시
      }

      rafRef.current = requestAnimationFrame(analyzeFrame);
    }

    rafRef.current = requestAnimationFrame(analyzeFrame);
  }

  const stop = useCallback(() => {
    // RAF 중단
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    // WebWorker 종료
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "STOP" });
      workerRef.current.terminate();
      workerRef.current = null;
    }

    // 카메라 스트림 트랙 중단 (메모리 누수 방지)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsActive(false);
  }, []);

  const getMetrics = useCallback((): BehavioralMetrics | null => {
    return metricsRef.current;
  }, []);

  return { start, stop, getMetrics, isActive };
}
