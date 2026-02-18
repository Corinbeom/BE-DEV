export type NavItem = {
  href: string;
  label: string;
  icon: string; // material symbol name
};

export const primaryNav: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: "dashboard" },
  { href: "/resume-analyzer", label: "이력서 면접", icon: "description" },
  { href: "/study-quiz/practice", label: "CS 문제풀이", icon: "code" },
  { href: "/application-tracker", label: "지원 현황", icon: "work" },
];


