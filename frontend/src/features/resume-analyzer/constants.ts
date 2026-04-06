export interface PositionOption {
  id: string;
  label: string;
  icon: string;
}

export interface PositionCategory {
  label: string;
  positions: PositionOption[];
}

export const POSITION_CATEGORIES: PositionCategory[] = [
  {
    label: "개발",
    positions: [
      { id: "BE", label: "백엔드", icon: "dns" },
      { id: "FE", label: "프론트엔드", icon: "web" },
      { id: "FULLSTACK", label: "풀스택", icon: "stacks" },
      { id: "MOBILE", label: "모바일", icon: "smartphone" },
      { id: "DEVOPS", label: "데브옵스", icon: "cloud_sync" },
      { id: "DATA_ENGINEER", label: "데이터 엔지니어", icon: "database" },
      { id: "ML_ENGINEER", label: "ML 엔지니어", icon: "model_training" },
      { id: "SECURITY", label: "보안", icon: "shield" },
      { id: "QA", label: "QA", icon: "bug_report" },
      { id: "GAME", label: "게임", icon: "sports_esports" },
      { id: "EMBEDDED", label: "임베디드", icon: "memory" },
    ],
  },
  {
    label: "기획 · 경영",
    positions: [
      { id: "PM", label: "프로덕트 매니저", icon: "target" },
      { id: "SERVICE_PLANNER", label: "서비스 기획", icon: "edit_note" },
      { id: "BUSINESS", label: "사업 개발", icon: "trending_up" },
    ],
  },
  {
    label: "디자인",
    positions: [
      { id: "UI_UX", label: "UI/UX", icon: "palette" },
      { id: "PRODUCT_DESIGN", label: "프로덕트 디자인", icon: "design_services" },
    ],
  },
  {
    label: "마케팅",
    positions: [
      { id: "MARKETING", label: "디지털 마케팅", icon: "campaign" },
      { id: "GROWTH", label: "그로스", icon: "rocket_launch" },
      { id: "CONTENT", label: "콘텐츠", icon: "article" },
    ],
  },
  {
    label: "데이터",
    positions: [
      { id: "DATA_ANALYST", label: "데이터 분석", icon: "analytics" },
      { id: "DATA_SCIENTIST", label: "데이터 사이언스", icon: "science" },
    ],
  },
];

export const ALL_POSITIONS = POSITION_CATEGORIES.flatMap((c) => c.positions);

export const TECH_PRESETS: Record<string, string[]> = {
  BE: ["Java", "Spring", "JPA", "MySQL", "PostgreSQL", "Redis", "Kafka", "Docker", "K8s", "AWS", "MongoDB", "gRPC"],
  FE: ["React", "Next.js", "TypeScript", "Vue", "Webpack", "Tailwind", "Redux", "GraphQL"],
  MOBILE: ["Kotlin", "Swift", "Flutter", "React Native", "Jetpack Compose"],
  FULLSTACK: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS"],
  DEVOPS: ["Docker", "K8s", "Terraform", "AWS", "CI/CD", "Prometheus", "Grafana"],
  DATA_ENGINEER: ["Python", "Spark", "Airflow", "SQL", "Kafka", "Hadoop", "AWS"],
  ML_ENGINEER: ["Python", "PyTorch", "TensorFlow", "MLflow", "Kubeflow", "Docker"],
};
