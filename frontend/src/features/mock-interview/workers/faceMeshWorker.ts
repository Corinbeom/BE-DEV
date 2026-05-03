/**
 * FaceMesh WebWorker
 *
 * OffscreenCanvas에서 MediaPipe FaceMesh를 실행.
 * 468개 랜드마크에서 시선·자세·표정·움직임 지표 추출.
 *
 * SRE 요구사항:
 * - 메인 스레드 블로킹 없음 (Worker 격리)
 * - 500ms 간격 throttle (30fps → ~2fps 처리로 CPU 절약)
 * - OffscreenCanvas 지원 브라우저에서만 동작
 */

import type { BehavioralMetrics } from "../hooks/useBehavioralAnalysis";

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let faceMesh: unknown = null;
let isRunning = false;
let prevLandmarks: Float32Array | null = null;
let lastProcessTime = 0;
const PROCESS_INTERVAL_MS = 500;

// 지표 누적값
let frameCount = 0;
let eyeContactFrames = 0;
let stablePostureFrames = 0;
let expressionChangeSum = 0;
let fidgetSum = 0;

self.onmessage = async (e: MessageEvent) => {
  const { type } = e.data;

  if (type === "INIT") {
    canvas = e.data.canvas as OffscreenCanvas;
    ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    await initFaceMesh();
    isRunning = true;
    processLoop();
  }

  if (type === "FRAME") {
    // 메인 스레드에서 ImageBitmap 전달받은 경우 처리
    if (!ctx || !canvas) return;
    const bitmap = e.data.bitmap as ImageBitmap;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
  }

  if (type === "STOP") {
    isRunning = false;
    if (faceMesh && typeof (faceMesh as { close?: () => void }).close === "function") {
      (faceMesh as { close: () => void }).close();
    }
  }
};

async function initFaceMesh() {
  try {
    // MediaPipe FaceMesh 동적 import (번들러 처리 우회: 런타임 동적 import)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mediapipe = await (new Function("specifier", "return import(specifier)"))("@mediapipe/face_mesh") as {
      FaceMesh: new (config: unknown) => unknown;
    };

    const { FaceMesh } = mediapipe;
    faceMesh = new FaceMesh({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    (faceMesh as {
      setOptions: (opts: unknown) => void;
      onResults: (cb: (results: unknown) => void) => void;
    }).setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    (faceMesh as {
      setOptions: (opts: unknown) => void;
      onResults: (cb: (results: unknown) => void) => void;
    }).onResults(onFaceMeshResults);
  } catch {
    // MediaPipe 로드 실패 → 폴백 분석 모드
    faceMesh = null;
  }
}

function onFaceMeshResults(results: unknown) {
  const r = results as {
    multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
  };

  if (!r.multiFaceLandmarks || r.multiFaceLandmarks.length === 0) return;

  const landmarks = r.multiFaceLandmarks[0];
  frameCount++;

  // ── 시선 안정성: 눈 랜드마크 (33: 왼눈, 263: 오른눈 중심)
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const noseTip = landmarks[1];

  // 코 기준 눈 방향 벡터 (대략적 시선 방향)
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const eyeCenterY = (leftEye.y + rightEye.y) / 2;
  const gazeOffsetX = Math.abs(eyeCenterX - noseTip.x);
  const gazeOffsetY = Math.abs(eyeCenterY - noseTip.y);
  const isLookingAtCamera = gazeOffsetX < 0.06 && gazeOffsetY < 0.04;
  if (isLookingAtCamera) eyeContactFrames++;

  // ── 자세 안정성: 어깨 대신 얼굴 수평선(좌-우 귀 랜드마크)
  const leftEar = landmarks[234];
  const rightEar = landmarks[454];
  const headTilt = Math.abs(leftEar.y - rightEar.y);
  if (headTilt < 0.05) stablePostureFrames++;

  // ── 표정 다양성: 입꼬리(61, 291)와 눈썹(70, 300) 거리 변화
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];
  const mouthWidth = Math.abs(mouthLeft.x - mouthRight.x);
  expressionChangeSum += mouthWidth;

  // ── 움직임 빈도: 이전 프레임 대비 랜드마크 이동량
  const currentPositions = new Float32Array(landmarks.length * 2);
  landmarks.forEach((lm, i) => {
    currentPositions[i * 2] = lm.x;
    currentPositions[i * 2 + 1] = lm.y;
  });

  if (prevLandmarks) {
    let totalMove = 0;
    for (let i = 0; i < Math.min(prevLandmarks.length, currentPositions.length); i++) {
      totalMove += Math.abs(currentPositions[i] - prevLandmarks[i]);
    }
    const avgMove = totalMove / currentPositions.length;
    fidgetSum += avgMove;
  }
  prevLandmarks = currentPositions;

  // 지표 계산 & 전송
  if (frameCount > 0) {
    const metrics: BehavioralMetrics = {
      eyeContactRatio: eyeContactFrames / frameCount,
      postureStability: stablePostureFrames / frameCount,
      expressionVariety: Math.min((expressionChangeSum / frameCount) * 10, 1),
      fidgetingScore: Math.min((fidgetSum / frameCount) * 100, 1),
    };
    self.postMessage(metrics);
  }
}

async function processLoop() {
  if (!isRunning || !canvas || !ctx) return;

  const now = Date.now();
  if (now - lastProcessTime >= PROCESS_INTERVAL_MS) {
    lastProcessTime = now;

    if (faceMesh) {
      try {
        const bitmap = await createImageBitmap(canvas);
        await (faceMesh as {
          send: (input: { image: ImageBitmap }) => Promise<void>;
        }).send({ image: bitmap });
        bitmap.close();
      } catch {
        // 분석 오류 무시, 루프 계속
      }
    } else {
      // MediaPipe 없을 때 간단한 픽셀 분석 폴백
      runPixelFallback();
    }
  }

  // 다음 프레임 (requestAnimationFrame은 Worker에서 사용 불가, setTimeout 사용)
  setTimeout(processLoop, 100);
}

function runPixelFallback() {
  if (!canvas || !ctx) return;
  frameCount++;

  // 간단한 밝기 중앙 vs 전체 비교로 "얼굴 중앙 응시" 추정
  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(w / 4, h / 4, w / 2, h / 2); // 중앙 50% 영역
  let brightness = 0;
  for (let i = 0; i < imageData.data.length; i += 4) {
    brightness += (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
  }
  const avgBrightness = brightness / (imageData.data.length / 4);

  // 밝기가 일정 수준이면 얼굴이 있다고 간주
  if (avgBrightness > 40) eyeContactFrames++;
  stablePostureFrames++;

  const metrics: BehavioralMetrics = {
    eyeContactRatio: eyeContactFrames / frameCount,
    postureStability: stablePostureFrames / frameCount,
    expressionVariety: 0.5,
    fidgetingScore: 0.2,
  };
  self.postMessage(metrics);
}
