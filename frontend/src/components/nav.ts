export type NavItem = {
  href: string;
  label: string;
  icon: string; // material symbol name
};

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: "dashboard" },
  { href: "/resume-analyzer", label: "이력서 면접", icon: "record_voice_over" },
  { href: "/study-quiz", label: "CS 문제풀이", icon: "quiz" },
  { href: "/application-tracker", label: "지원 현황", icon: "work_history" },
];


