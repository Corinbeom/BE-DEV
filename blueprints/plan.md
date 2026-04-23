# DevWeb UI 전면 리팩토링 — Blueprint

> **의회 합의 완료** (PM · Dev · Designer · SRE · QA 전원 [Approved])
> 브랜치: `refactor/ui-redesign` (develop에서 분기)

---

## 디자인 시스템 확정

### 컬러 팔레트

| 역할 | Hex | oklch (Tailwind 4) | 설명 |
|---|---|---|---|
| Brand / Text Heading | `#1A1A2E` | `oklch(0.18 0.06 280)` | Deep Midnight |
| **Accent / CTA** | `#E8C547` | `oklch(0.82 0.16 88)` | Pre-dawn Gold ← 배경으로만 사용 |
| Background (Light) | `#F8F7F4` | `oklch(0.98 0.005 80)` | Warm Off-white |
| Surface (Light) | `#FFFFFF` | — | 카드/패널 |
| Background (Dark) | `#0F0F17` | `oklch(0.12 0.02 280)` | Void |
| Surface (Dark) | `#1A1A2E` | `oklch(0.18 0.06 280)` | — |
| Muted Text | `#6B6B7B` | `oklch(0.50 0.01 280)` | Cool Gray |
| Success | `#2D7D6F` | `oklch(0.52 0.10 175)` | Deep Teal |
| Danger | `#D94F3D` | `oklch(0.55 0.18 25)` | Muted Red |

**골드 사용 규칙 (QA 강제):**
- ✅ `bg-accent text-[#1A1A2E]` — Primary 버튼, 강조 배지
- ✅ `border-l-4 border-accent` — Tier 1 카드 accent line
- ❌ 텍스트 색 / 링크 색 / ghost 버튼 색으로 사용 금지 (WCAG AA 미충족)

### 타이포그래피

| 용도 | 폰트 | 비고 |
|---|---|---|
| 본문 전체 | **Geist** | `next/font/google`, Manrope 대체 |
| 숫자 / 통계 / 코드 | **Geist Mono** | 점수, 비율, 날짜 강조 |

### 카드 계층 (Hierarchy)

```
Primary Content
  border border-border, bg-card, rounded-xl
  → 세션 카드, 질문 카드 등 핵심 콘텐츠
  → 위계는 색이 아닌 구조·여백·타이포그래피로 표현

Secondary Info
  border border-border, bg-card, rounded-xl
  → 통계, 메타 정보, 사이드 패널

Ghost / Empty State
  border-dashed border-border, bg-transparent, rounded-xl
  → 빈 상태, 드롭존, 플레이스홀더
```

> ⚠️ border-l-4 좌측 색상 띠는 **전면 폐기** (2026-04 사용자 피드백).
> 내비게이션 active 표시용 border-l-2는 예외적으로 유지.

### 공통 규칙
- 모서리: `rounded-xl` 통일 (rounded-lg/2xl 혼재 제거)
- 이모지: **전면 제거** — Material Symbols Outlined 아이콘으로 대체
- 그라데이션: 다크 그라데이션(`from-[#1A1A2E] to-[#2D2D4A]`)만 허용, 파스텔 그라데이션 금지
- 섀도: `shadow-sm` 이상 사용 금지. 대신 border로 구분
- `prefers-reduced-motion`: 모든 애니메이션에 대응 필수

---

## 구현 프로세스 (모든 Phase 공통)

```
① PM + Designer 사전 설계 검토  →  ② Dev 구현  →  ③ PM + Designer 코드 리뷰 (비판적)  →  ④ QA Final Audit  →  ⑤ 머지
```

> Phase별 코드 작성 **전** PM·Designer의 설계 합의가 선행되어야 한다.
> 코드 작성 **후** PM·Designer의 비판적 리뷰 없이 머지 불가.

---

## 구현 우선순위

| Phase | 대상 | 핵심 변경 | 상태 |
|---|---|---|---|
| **P0** | `globals.css` + 폰트 | 컬러 변수 전면 교체, Geist 적용 → 모든 페이지 즉시 반영 | ⬜ |
| **P1** | AppSidebar · AppHeader | 컬러 정리, 네비게이션 UX 개선, 이모지 제거 | ⬜ |
| **P2** | Dashboard | 캐러셀 제거, 정보 위계 재설계, 통계 타이포 강화 | ⬜ |
| **P3** | Resume Analyzer (Hub + Practice + Report) | 카드 시스템 교체, 이모지 제거, 면접 리포트 UI 개선 | ⬜ |
| **P4** | CS Quiz (Hub + Practice) | 동일 패턴 적용, 정답/오답 색상 teal/red로 교체 | ⬜ |
| **P5** | Application Tracker · Profile | Kanban 카드 정리, 프로필 레이아웃 개선 | ⬜ |
| **P6** | 랜딩 페이지 (`/login`) | **P0~P5 완료 후** 실제 서비스 UI 스크린샷 포함 전면 재설계 | ⬜ |

---

## Phase별 상세 설계

### P0: globals.css + 폰트 (기반 작업)
**변경 파일:** `app/globals.css`, `app/layout.tsx`

- `--primary` → oklch(0.18 0.06 280) [Deep Midnight]
- `--accent` → oklch(0.82 0.16 88) [Pre-dawn Gold]
- `--background` → oklch(0.98 0.005 80) [Warm Off-white]
- `--muted` → oklch(0.50 0.01 280)
- Dark mode 변수 재정의
- `next/font/google`에서 Geist + Geist Mono 로드
- `layout.tsx`에서 Manrope → Geist className 교체

### P1: AppSidebar · AppHeader
**변경 파일:** `components/AppSidebar.tsx`, `components/AppHeader.tsx`

- 사이드바 배경: Light → `bg-background border-r`, Dark → `bg-surface`
- 활성 메뉴: 좌측 `border-l-2 border-accent` accent line + `bg-accent/10`
- 이모지 아이콘 제거, Material Symbols 통일
- 네비 항목 레이블 정리 (현재 기능 기준으로 갱신)

### P2: Dashboard
**변경 파일:** `features/dashboard/components/DashboardView.tsx`

- 캐러셀(Embla) 제거
- 상단: Today's Focus 1개 강조 카드 (Tier 1)
- 중단: 핵심 지표 3개 (숫자 Geist Mono, 크고 단호하게)
- 하단 2/3: 최근 세션 목록 | 1/3: Quick Actions
- 파스텔 그라데이션 stat 카드 → Tier 2 카드로 교체

### P3: Resume Analyzer
**변경 파일:** Hub, Practice, Report 컴포넌트

- 세션 카드 → Tier 1 (border-l-4 gold)
- 이모지 제거
- 면접 리포트: 점수 Geist Mono, 섹션 구분 명확화
- AI 코칭 리포트: 재분석 쿨다운 UI 개선

### P4: CS Quiz
**변경 파일:** Hub, Practice 컴포넌트

- 정답: emerald → Deep Teal (`#2D7D6F`)
- 오답: red → Muted Red (`#D94F3D`)
- 객관식 선택지 UI: 기존 radio → border-l-4 Tier 1 스타일

### P5: Application Tracker · Profile
**변경 파일:** ApplicationTrackerView, ProfileView

- Kanban 카드 left border → Tier 1 패턴
- 통계 카드 그라데이션 제거
- 프로필 헤더 그라데이션 → Deep Midnight flat

### P6: 랜딩 페이지 (최후순위)
**변경 파일:** `app/login/page.tsx`

> P0~P5 완료 후 실제 서비스 UI 스크린샷 촬영하여 삽입

**4섹션 구조:**
```
Section 1 — Hero (Dark, #0F0F17)
  헤드라인 + 서브카피 + CTA (단 하나)
  우측: 실제 앱 UI 스크린샷 패널

Section 2 — Feature Showcase
  4개 기능 각각 별도 설명:
  ① AI 면접 질문 생성 + 실시간 피드백
  ② 누적 AI 코칭 리포트 (성장 궤적)
  ③ CS 퀴즈 세션
  ④ 지원 현황 칸반

Section 3 — UI Preview
  실제 스크린샷 카드 3~4장

Section 4 — Login CTA
  OAuth 버튼 (Google · Kakao)
```

---

## 예상 효과

| 항목 | Before | After |
|---|---|---|
| 컬러 | 인디고 (AI 뻔함) | Deep Midnight + Gold (브랜드 아이덴티티) |
| 폰트 | Manrope | Geist + Geist Mono |
| 카드 | 단일 패턴 | 3-tier hierarchy |
| 이모지 | 곳곳에 산재 | 전면 제거 |
| 랜딩 | 구기능 나열 | 실제 UI 스크린샷 포함 전체 기능 노출 |
| 그라데이션 | 파스텔 남용 | 다크 그라데이션만 허용 |
