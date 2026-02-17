## [PRD] 취업 준비 올인원 플랫폼
1. 프로젝트 개요
- 프로젝트 명: DevWeb

    - 목적: AI 기반의 이력서 분석 및 맞춤형 면접 준비, 체계적인 지원 현황 관리를 제공하는 올인원 플랫폼

    - 핵심 가치: 
        - Context-Aware: 내 이력서에 특화된 실전 질문 생성

        - Structured Tracking: 파편화된 지원 정보를 한눈에 관리

        - Data-Driven Feedback: CS 문제 풀이에 대한 정교한 AI 피드백

## 2. 주요 기능 상세 (User Stories & Requirements)
- 2.1. AI 이력서 분석 (Resume-Analyzer)
    - 기능 : PDF/Text 이력서/포트폴리오 파싱 및 포지션 별 맞춤형 기술 면접 질문 생성
    
    - 상세 요구사항 :

        - 이력서(PDF/Text) 업로드 및 텍스트 파싱

        - 선택한 포지션(BE, FE, Mobile 등)에 따른 면접 질문 생성 전략 분기

        - 출력 데이터: 질문, 출제 의도, 핵심 키워드, 모범 답안
    
    - 객체 책임 : 
        - Resume : 이력서 데이터 보유 및 텍스트 추출 상태 관리

        - QuestionGenerator : 전략에 따른 AI 협력 및 질문 생성

        - PositionStrategy : 포지션 별 특화 프롬프트 제공

- 2.2. CS 문제 풀이 (Study-Quiz)
    - 기능 : 카테고리 별 문제 은행 제공 및 AI 기반 주관식 답변 첨삭

    - 상세 요구사항 : 

        - 5대 카테고리(OS, DB, Network, DS, Algorithm) 기반 문제 은행

        - 상/중/하 난이도 조절 및 주관식 답안에 대한 AI 첨삭 피드백

        - AI가 답변 정확도를 분석하여 개선 방향을 제시하는 상세 피드백 엔진

    - 객체 책임 :

        - ProblemBank : 문제 데이터 및 카테고리 관리

        - FeedbackEngine : AI를 통한 답변 분석 및 채점

- 2.3. 지원 현황 대시보드 (Application-Tracker)
    - 기능 : 전형 단계 관리 및 시각화 통계 자료 제공

    - 상세 요구사항 :

        - 칸반 보드 또는 테이블 뷰를 통한 전형 상태 관리

        - 지원 이력 기반 통계 시각화 (Recharts 사용)
    
    - 객체 책임 :
        - JobApplication : 전형 상태 및 지원 정보 관리

        - StatsAnalyzer : 통계 데이터 계산 및 가공


3. 기술 스택 및 아키텍처
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Recharts

- Backend: Spring Boot 3.2, Java 17, Spring Data JPA, Spring AI

- Database: PostgreSQL, Redis (Caching)

- Storage: AWS S3 (이력서 및 제출 서류 보관/변경 가능)

- Architecture: api(Web), domain(Core), infra(Implementation) 계층 분리를 통한 DIP 실현

4. 개발 가이드라인 (For Cursor)
- 폴더 구조: Backend는 com.devweb.domain(순수 로직)과 com.devweb.infra(구현체)로 분리하며, Frontend는 src/features/ 하위에 도메인별로 응집

- 설계 원칙: 엔티티 내부에 비즈니스 로직을 구현하는 Rich Domain Model 지향

- 응답 규격: 모든 API는 ApiResponse(success, data, error) 규격 사용